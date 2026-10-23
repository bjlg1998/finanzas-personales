const test = require('node:test');
const assert = require('node:assert/strict');
const { addFixedPayment, setFixedPaymentTotal, fixedPaidAmount, reviseFixedExpense } = require('../src/domain/payments');
const { closeSalaryPeriod, nextSalaryDate } = require('../src/domain/periods');
const { planPaymentDate, cycleFor } = require('../src/domain/dates');
const { selectPlanSummary, paymentStatusFor } = require('../src/domain/selectors');
const { predictCategory } = require('../src/domain/categories');
const { migrateFinanceData } = require('../src/data/migrations');
const { createFinanceRepository, STORE_KEY, BACKUP_KEY } = require('../src/services/financeRepository');
const { createReminderSynchronizer } = require('../src/services/reminderSynchronizer');
const { reminderSpecs, expenseFromNotification } = require('../src/domain/reminders');

const expense = (patch = {}) => ({ id: 'light', name: 'Luz', amount: 150000, paidAmount: 0, installmentsTotal: 12, installmentsPaid: 3, installmentAdvanced: false, paymentTiming: 'payday', active: true, category: 'Servicios', ...patch });
const plan = (patch = {}) => migrateFinanceData({ salary: 1000000, carry: 0, goal: 100000, fixed: [expense()], expenses: [], periods: [], activeCycleStart: new Date(2026, 9, 31).toISOString(), payDay: 31, categoryDetectionVersion: 1, ...patch });

test('extra income affects balance and percentages while unused categories stay hidden', () => {
  const data = plan({extraIncome:200000});
  const summary = selectPlanSummary(data, cycleFor(new Date(), data.activeCycleStart));
  assert.equal(summary.totalBase, 1200000);
  assert.equal(summary.available, 950000);
  assert.deepEqual(summary.distribution.map(p=>p.label), ['Servicios','Ahorro','Disponible']);
  assert.equal(summary.distribution.find(p=>p.label==='Disponible').amount,950000);
  assert.ok(Math.abs(summary.distribution.reduce((s,p)=>s+p.width,0)-100)<0.0001);
});

test('extra income is archived, only recurring extra repeats, and surplus never rolls over', () => {
  for (const recurring of [true,false]) {
    const data = plan({extraIncome:200000,extraIncomeLabel:'Bono',extraIncomeRecurring:recurring});
    const closed = closeSalaryPeriod(data,new Date(2026,10,2));
    assert.equal(closed.periods[0].income,1200000);
    assert.equal(closed.periods[0].extraIncomeLabel,'Bono');
    assert.equal(closed.extraIncome, recurring ? 200000 : 0);
    assert.equal(closed.carry,0);
  }
});

test('distribution handles no expenses, no balance, overspending and all categories', () => {
  const {PAYMENT_CATEGORIES}=require('../src/domain/categories');
  for(const data of [plan({fixed:[],goal:0}),plan({fixed:[expense({amount:1000000})],goal:0}),plan({fixed:[expense({amount:2000000})]}),plan({fixed:Object.keys(PAYMENT_CATEGORIES).map((category,i)=>expense({id:String(i),category,amount:10000}))})]) {
    const summary=selectPlanSummary(data,cycleFor(new Date(),data.activeCycleStart));
    assert.ok(summary.distribution.every(p=>Number.isFinite(p.percent)&&p.width>0));
    assert.ok(Math.abs(summary.distribution.reduce((s,p)=>s+p.width,0)-100)<0.0001);
    assert.equal(summary.distribution.some(p=>p.label==='Disponible'),summary.available>0);
  }
});

test('extra income migration defaults and validation preserve old plans', () => {
  assert.equal(plan().extraIncome,0);
  for (const extraIncome of [-1,1.5,Infinity]) assert.throws(()=>plan({extraIncome}));
  assert.throws(()=>plan({extraIncomeRecurring:'yes'}));
});

test('reminders show remaining balance and only navigate to the current valid expense', () => {
  const data=plan({fixed:[expense({paidAmount:60000})]});
  const specs=reminderSpecs(data,new Date(2026,9,29));
  assert.equal(specs.length,2);
  assert.equal(specs[0].remaining,90000);
  assert.match(specs[0].body,/Saldo pendiente/);
  assert.match(specs[1].title,/Hoy/);
  const response={notification:{request:{content:{data:{type:'payment',expenseId:'light',cycleStart:data.activeCycleStart}}}}};
  assert.equal(expenseFromNotification(response,data).id,'light');
  assert.equal(expenseFromNotification(response,{...data,activeCycleStart:'other'}),null);
  assert.equal(expenseFromNotification(response,{...data,fixed:[]}),null);
  assert.equal(expenseFromNotification(null,data),null);
});
function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return { values, getItem: async (key) => values.get(key) || null, setItem: async (key, value) => { values.set(key, value); } };
}

test('partial payments do not advance an installment; completion advances once', () => {
  const partial = addFixedPayment(expense(), 60000);
  assert.equal(partial.paidAmount, 60000);
  assert.equal(partial.installmentsPaid, 3);
  const complete = addFixedPayment(partial, 90000);
  assert.equal(complete.paid, true);
  assert.equal(complete.installmentsPaid, 4);
  assert.equal(setFixedPaymentTotal(complete, 150000).installmentsPaid, 4);
});

test('correcting a complete payment restores the pending amount and installment', () => {
  const complete = addFixedPayment(expense(), 150000);
  const partial = setFixedPaymentTotal(complete, 60000);
  assert.equal(partial.installmentsPaid, 3);
  assert.equal(partial.paid, false);
  assert.equal(setFixedPaymentTotal(partial, 0).paidAmount, 0);
  assert.equal(addFixedPayment(partial, 90000).installmentsPaid, 4);
});

test('rejects invalid money and never exceeds the installment total', () => {
  for (const amount of [-1, NaN, Infinity, .5, 150001]) assert.throws(() => setFixedPaymentTotal(expense(), amount));
  assert.throws(() => addFixedPayment(expense(), 0));
  const complete = addFixedPayment(expense({ installmentsPaid: 12 }), 150000);
  assert.equal(complete.installmentsPaid, 12);
  assert.equal(setFixedPaymentTotal(complete, 0).installmentsPaid, 12);
  assert.equal(fixedPaidAmount(expense({ paidAmount: undefined, paid: true })), 150000);
});

test('salary-day and next-day payments cross months correctly, including leap years', () => {
  assert.equal(planPaymentDate(new Date(2026, 9, 31), { paymentTiming: 'nextday' }).getMonth(), 10);
  assert.equal(planPaymentDate(new Date(2026, 9, 31), { paymentTiming: 'nextday' }).getDate(), 1);
  assert.equal(planPaymentDate(new Date(2028, 0, 31), { dueDay: 31 }).getDate(), 29);
  assert.equal(nextSalaryDate(new Date(2026, 0, 31), 31).getDate(), 28);
  assert.equal(nextSalaryDate(new Date(2026, 8, 30), 30).getDate(), 30);
});

test('editing an amount reuses payment rules and preserves legacy paid flags', () => {
  const complete = addFixedPayment(expense(), 150000);
  const increased = reviseFixedExpense(complete, { amount: 200000 });
  assert.equal(increased.paidAmount, 150000);
  assert.equal(increased.paid, false);
  assert.equal(increased.installmentsPaid, 3);
  const legacy = reviseFixedExpense(expense({ paidAmount: undefined, paid: true }), { amount: 150000 });
  assert.equal(legacy.paidAmount, 150000);
});

test('closing a salary archives actual payments and does not carry its surplus', () => {
  const before = plan({ fixed: [expense({ paidAmount: 60000 })] });
  const closed = closeSalaryPeriod(before, new Date(2026, 10, 1));
  assert.equal(closed.periods[0].spent, 60000);
  assert.equal(closed.periods[0].saved, 940000);
  assert.equal(closed.periods[0].fixed[0].paidAmount, 60000);
  assert.equal(closed.carry, 0);
  assert.equal(closed.fixed[0].paidAmount, 0);
  assert.equal(closed.fixed[0].active, true);
  assert.equal(before.fixed[0].paidAmount, 60000);
});

test('distribution counts each expense once and stays bounded above 100% commitment', () => {
  const data = plan({ fixed: [expense({ amount: 1200000 })] });
  const summary = selectPlanSummary(data, cycleFor(new Date(), data.activeCycleStart));
  assert.equal(summary.available, -300000);
  assert.equal(summary.distribution.reduce((sum, item) => sum + item.amount, 0), 1300000);
  assert.ok(Math.abs(summary.distribution.reduce((sum, item) => sum + item.width, 0) - 100) < .0001);
});

test('status distinguishes a late planned payment from an overdue invoice', () => {
  const start = new Date(2026, 9, 31);
  const item = expense({ deadlineDay: 10 });
  assert.equal(paymentStatusFor(item, start, new Date(2026, 10, 2)).text, 'Pago planeado atrasado');
  assert.equal(paymentStatusFor(item, start, new Date(2026, 10, 11)).text, 'Factura vencida');
  assert.equal(paymentStatusFor({ ...item, paidAmount: 150000 }, start, new Date(2026, 10, 11)).text, 'Pagado');
});

test('migrations classify legacy names once and retain manual corrections thereafter', () => {
  const legacy = { ...plan(), categoryDetectionVersion: 0, fixed: [expense({ category: 'Otros' })] };
  const migrated = migrateFinanceData(legacy);
  assert.equal(migrated.fixed[0].category, 'Servicios');
  assert.equal(legacy.fixed[0].category, 'Otros');
  migrated.fixed[0].category = 'Deudas';
  assert.equal(migrateFinanceData(migrated).fixed[0].category, 'Deudas');
  assert.equal(predictCategory('Crédito Nu'), 'Deudas');
});

test('legacy snapshots preserve paid flags, history, unknown fields and store key', async () => {
  const legacy = plan({ customField: 'preserve', fixed: [expense({ paidAmount: undefined, paid: true })] });
  const storage = memoryStorage({ [STORE_KEY]: JSON.stringify(legacy) });
  const loaded = await createFinanceRepository(storage).load();
  assert.equal(loaded.data.customField, 'preserve');
  assert.equal(fixedPaidAmount(loaded.data.fixed[0]), 150000);
  assert.equal(STORE_KEY, '@flujo/v1');
});

test('repository serializes concurrent writes and keeps a prior valid backup', async () => {
  const storage = memoryStorage();
  const repository = createFinanceRepository(storage);
  const data = plan();
  await Promise.all([repository.save(data), repository.save({ ...data, salary: 2000000 }), repository.save({ ...data, salary: 3000000 })]);
  assert.equal(JSON.parse(storage.values.get(STORE_KEY)).salary, 3000000);
  assert.equal(JSON.parse(storage.values.get(BACKUP_KEY)).salary, 2000000);
});

test('corrupt data recovers a valid backup, but is not overwritten when no backup exists', async () => {
  const storage = memoryStorage({ [STORE_KEY]: '{broken', [BACKUP_KEY]: JSON.stringify(plan()) });
  const loaded = await createFinanceRepository(storage).load();
  assert.equal(loaded.recovered, true);
  const broken = memoryStorage({ [STORE_KEY]: '{broken' });
  await assert.rejects(createFinanceRepository(broken).load());
  assert.equal(broken.values.get(STORE_KEY), '{broken');
});

test('future schemas are not downgraded by restoring an older backup', async () => {
  const storage = memoryStorage({ [STORE_KEY]: JSON.stringify({ ...plan(), schemaVersion: 999 }), [BACKUP_KEY]: JSON.stringify(plan()) });
  await assert.rejects(createFinanceRepository(storage).load(), { code: 'FUTURE_SCHEMA' });
});

test('failed writes surface an error and a subsequent retry succeeds', async () => {
  const storage = memoryStorage();
  const write = storage.setItem;
  let failing = true;
  storage.setItem = async (...args) => { if (failing) throw new Error('disk full'); return write(...args); };
  const repository = createFinanceRepository(storage);
  await assert.rejects(repository.save(plan()), /disk full/);
  failing = false;
  await repository.save(plan());
  assert.equal(JSON.parse(storage.values.get(STORE_KEY)).salary, 1000000);
});

test('reminders are idempotent, complete payment cancels, and correction restores two notices', async () => {
  const scheduled = new Map([['legacy', {identifier:'legacy',content:{data:{type:'payment',reminderKey:'finance:old-format'}}}]]);
  const adapter = { configure: async () => {}, list: async () => [...scheduled.values()], hasPermission: async () => true, now: () => new Date(2026, 9, 1), cancel: async (id) => scheduled.delete(id), schedule: async (spec) => scheduled.set(spec.key, { identifier: spec.key, content: { data: { type: 'payment', reminderKey: spec.key } } }) };
  const synchronize = createReminderSynchronizer(adapter);
  const data = plan();
  await Promise.all([synchronize(data), synchronize(data)]);
  assert.equal(scheduled.size, 2);
  assert.equal(scheduled.has('legacy'), false);
  const paid = { ...data, fixed: [setFixedPaymentTotal(data.fixed[0], 150000)] };
  await synchronize(paid);
  assert.equal(scheduled.size, 0);
  await synchronize({ ...paid, fixed: [setFixedPaymentTotal(paid.fixed[0], 0)] });
  assert.equal(scheduled.size, 2);
});
