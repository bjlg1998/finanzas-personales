const test = require('node:test');
const assert = require('node:assert/strict');
const { distributeSimulatedPayment, emptyScenario, remainingInstallments, simulationSalaryDate, simulationMonth, simulationTotals, toggleSimulatedPayment, validateSimulation } = require('../src/domain/simulation');
const { createSimulationRepository, SIMULATION_KEY } = require('../src/services/simulationRepository');
const { STORE_KEY } = require('../src/services/financeRepository');
const expense = { id: 'addi', name: 'Addi amor', amount: 60000, installmentsTotal: 2, installmentsPaid: 0 };
const scenario = month => ({month, salary: 1000000, extra: 0, payments: []});
const document = () => ({version: 1, scenarios: ['2026-11','2026-12','2027-01'].map(scenario)});

test('projections start empty and include only recurring extra, never surplus, goal or current payments', () => {
  const data = {salary:1000000, extraIncome:50000, extraIncomeRecurring:false, carry:90000, goal:100000, fixed:[expense]};
  const value = emptyScenario(new Date(2026,10,30), data);
  assert.deepEqual(value, scenario('2026-11'));
  assert.equal(emptyScenario(new Date(2026,10,30), {...data, extraIncomeRecurring:true}).extra, 50000);
  assert.equal(simulationTotals(value).available, 1000000);
});
test('salary dates clamp payday in February, preserve day 30 and cross year', () => {
  const anchor = new Date(2026,9,31);
  assert.equal(simulationSalaryDate(anchor, 4, 31).getDate(),28);
  assert.equal(simulationMonth(simulationSalaryDate(anchor, 3, 30)), '2027-01');
  assert.equal(simulationSalaryDate(anchor, 3, 30).getDate(),30);
  assert.equal(simulationSalaryDate(new Date(2028,0,31),1,31).getDate(),29);
});
test('two Addi installments can be placed in arbitrary salaries but never a third; deselection frees quota', () => {
  const original = document();
  const first = toggleSimulatedPayment(original,'2026-11',expense);
  const second = toggleSimulatedPayment(first,'2027-01',expense);
  assert.throws(() => toggleSimulatedPayment(second,'2026-12',expense), /cuotas pendientes/);
  const moved = toggleSimulatedPayment(toggleSimulatedPayment(second,'2026-11',expense),'2026-12',expense);
  assert.equal(moved.scenarios[0].payments.length,0);
  assert.equal(moved.scenarios[1].payments.length,1);
  assert.equal(moved.scenarios[2].payments.length,1);
  assert.deepEqual(original,document());
  assert.equal(expense.installmentsPaid,0);
});
test('paid or inactive flags do not imply monthly recurrence and completed installments cannot be selected', () => {
  assert.equal(remainingInstallments({...expense, installmentsPaid:1}),1);
  assert.equal(remainingInstallments({...expense, installmentsTotal:0}),null);
  assert.throws(() => toggleSimulatedPayment(document(),'2026-11',{...expense, installmentsPaid:2}), /cuotas pendientes/);
  assert.equal(toggleSimulatedPayment(document(),'2026-11',{...expense, active:false, paid:true, installmentsTotal:0}).scenarios[0].payments.length,1);
});
test('explicit distribution stops at two pending installments and never duplicates an existing selection', () => {
  const original = document();
  const result = distributeSimulatedPayment({version:1,scenarios:[]}, original.scenarios, expense);
  assert.deepEqual(result.scenarios.map(value => value.payments.length),[1,1]);
  assert.deepEqual(distributeSimulatedPayment(result, original.scenarios, expense),result);
  const recurring = {...expense,installmentsTotal:0};
  assert.deepEqual(distributeSimulatedPayment(original,original.scenarios,recurring).scenarios.map(value=>value.payments.length),[1,1,1]);
  assert.deepEqual(original,document());
});
test('scenario sums hypothetical and saved payments, shows shortfall, never carries balance to other month', () => {
  const first = toggleSimulatedPayment(document(),'2026-11',expense);
  first.scenarios[0].payments.push({id:'custom:1',sourceId:null,name:'Viaje',amount:1200000});
  first.scenarios[0].extra = 100000;
  assert.deepEqual(simulationTotals(first.scenarios[0]),{income:1100000,payments:1260000,available:-160000});
  assert.equal(simulationTotals(first.scenarios[1]).available,1000000);
});
test('old salary simulations do not consume remaining installments after the real cycle advances', () => {
  const past = toggleSimulatedPayment(document(),'2026-11',expense);
  const next = toggleSimulatedPayment(past,'2026-12',{...expense,installmentsPaid:1},'2026-12');
  assert.equal(next.scenarios[0].payments.length,1);
  assert.equal(next.scenarios[1].payments.length,1);
  assert.throws(()=>toggleSimulatedPayment(next,'2027-01',{...expense,installmentsPaid:1},'2026-12'),/cuotas pendientes/);
});
test('simulation storage validates schema, duplicate months/payments, names and integer COP totals', () => {
  assert.equal(validateSimulation(document()).version,1);
  for (const value of [null, {version:2,scenarios:[]}, {...document(),scenarios:[scenario('2026-13')]}, {...document(),scenarios:[scenario('2026-11'),scenario('2026-11')]}, {...document(),scenarios:[{...scenario('2026-11'), salary:-1}]}]) assert.throws(() => validateSimulation(value));
  const base = toggleSimulatedPayment(document(),'2026-11',expense);
  for(const patch of [{amount:0},{amount:1.5},{name:' '},{sourceId:42}]) {
    const copy = JSON.parse(JSON.stringify(base)); Object.assign(copy.scenarios[0].payments[0],patch);
    assert.throws(() => validateSimulation(copy));
  }
  const copy = JSON.parse(JSON.stringify(base)); copy.scenarios[0].payments.push({...copy.scenarios[0].payments[0],id:'different'});
  assert.throws(() => validateSimulation(copy));
});
test('repository uses a separate key, serializes saves and waits for pending writes before reopening', async () => {
  const values = new Map([[STORE_KEY, 'actual finances untouched']]);
  const storage = {getItem:async key => values.get(key) ?? null, setItem:async (key,value) => { await new Promise(resolve => setTimeout(resolve, 5)); values.set(key,value); }};
  const repository = createSimulationRepository(storage);
  assert.deepEqual(await repository.load(),{version:1,scenarios:[]});
  const a = document();
  const b = toggleSimulatedPayment(a,'2026-12',expense);
  const writes = [repository.save(a),repository.save(b)];
  assert.deepEqual(await repository.load(),b);
  await Promise.all(writes);
  assert.equal(values.get(STORE_KEY),'actual finances untouched');
  assert.notEqual(SIMULATION_KEY, STORE_KEY);
});
test('unreadable storage is not overwritten and failed writes allow a later retry', async () => {
  let raw = '{invalid'; let fail = false;
  const repository = createSimulationRepository({getItem: async () => raw, setItem:async (key,value) => { if(fail)throw new Error('disk full'); raw = value; }});
  await assert.rejects(repository.load());
  assert.equal(raw,'{invalid');
  fail = true; await assert.rejects(repository.save(document()));
  fail = false; await repository.save(document());
  assert.deepEqual(await repository.load(),document());
});
