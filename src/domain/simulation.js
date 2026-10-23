/** @typedef {{id:string, sourceId:string|null, name:string, amount:number}} SimulatedPayment */
/** @typedef {{month:string, salary:number, extra:number, payments:SimulatedPayment[]}} SalaryScenario */
/** @typedef {{version:1, scenarios:SalaryScenario[]}} SimulationData */
const {
  assertAmount
} = require('./payments');

/** A simulation month identifies the salary, not the month in which bills fall.
 * @param {Date} anchor @param {number} offset @param {number} payDay
 */
function simulationSalaryDate(anchor, offset, payDay) {
  const month = new Date(anchor.getFullYear(), anchor.getMonth() + offset, 1);
  return new Date(month.getFullYear(), month.getMonth(), Math.min(payDay, new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()));
}
/** @param {Date} date */
function simulationMonth(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
/** @param {Date} date @param {Pick<import('./models').FinanceData,'salary'|'extraIncome'|'extraIncomeRecurring'>} data @returns {SalaryScenario} */
function emptyScenario(date, data) {
  return {
    month: simulationMonth(date),
    salary: data.salary,
    extra: data.extraIncomeRecurring ? data.extraIncome || 0 : 0,
    payments: []
  };
}
/** @param {import('./models').FixedExpense} item */
function remainingInstallments(item) {
  return item.installmentsTotal ? Math.max(0, item.installmentsTotal - (item.installmentsPaid || 0)) : null;
}
/** Past projections are retained, but cannot consume future installment capacity.
 * @param {SimulationData} simulation @param {string} sourceId @param {string} [fromMonth]
 */
function allocatedInstallments(simulation, sourceId, fromMonth = '') {
  return simulation.scenarios.reduce((total, scenario) => total + (scenario.month >= fromMonth ? scenario.payments.filter(payment => payment.sourceId === sourceId).length : 0), 0);
}
/** One selected payment represents one installment. Nothing is inferred from active/paid flags.
 * @param {SimulationData} simulation @param {string} month @param {import('./models').FixedExpense} item @param {string} [fromMonth]
 * @returns {SimulationData}
 */
function toggleSimulatedPayment(simulation, month, item, fromMonth = '') {
  const scenario = simulation.scenarios.find(value => value.month === month);
  if (!scenario) throw new Error('Selecciona un sueldo para simular.');
  const included = scenario.payments.some(value => value.sourceId === item.id);
  const remaining = remainingInstallments(item);
  const assigned = allocatedInstallments(simulation, item.id, fromMonth);
  if (!included && remaining !== null && assigned >= remaining) throw new Error('Ya distribuiste todas las cuotas pendientes de este gasto. Quita una de otro sueldo para moverla aquí.');
  assertAmount(item.amount, false);
  return {
    ...simulation,
    scenarios: simulation.scenarios.map(value => value.month !== month ? value : {
      ...value,
      payments: included ? value.payments.filter(payment => payment.sourceId !== item.id) : [...value.payments, {
        id: `fixed:${item.id}`,
        sourceId: item.id,
        name: item.name,
        amount: item.amount
      }]
    })
  };
}
/** Explicit opt-in to repeat only across the supplied salaries, limited by unpaid installments.
 * @param {SimulationData} simulation @param {SalaryScenario[]} scenarios @param {import('./models').FixedExpense} item @param {string} [fromMonth]
 */
function distributeSimulatedPayment(simulation, scenarios, item, fromMonth = '') {
  let next = simulation;
  const remaining = remainingInstallments(item);
  for (const value of scenarios) {
    const current = next.scenarios.find(entry => entry.month === value.month) || value;
    if (current.payments.some(payment => payment.sourceId === item.id)) continue;
    const assigned = allocatedInstallments(next, item.id, fromMonth);
    if (remaining !== null && assigned >= remaining) break;
    if (!next.scenarios.some(entry => entry.month === value.month)) next = {
      ...next,
      scenarios: [...next.scenarios, current]
    };
    next = toggleSimulatedPayment(next, value.month, item, fromMonth);
  }
  return next;
}
/** @param {SalaryScenario} scenario */
function simulationTotals(scenario) {
  const income = scenario.salary + scenario.extra;
  const payments = scenario.payments.reduce((total, payment) => total + payment.amount, 0);
  return {
    income,
    payments,
    available: income - payments
  };
}
/** Persist only a small, validated independent document, never the finance store.
 * @param {unknown} value @returns {SimulationData}
 */
function validateSimulation(value) {
  if (!value || typeof value !== 'object') throw new Error('Simulación no válida.');
  const document = /** @type {SimulationData} */ (value);
  if (document.version !== 1 || !Array.isArray(document.scenarios) || document.scenarios.length > 120) throw new Error('Formato de simulación no compatible.');
  const months = new Set();
  for (const scenario of document.scenarios) {
    if (!scenario || !/^\d{4}-(0[1-9]|1[0-2])$/.test(scenario.month) || months.has(scenario.month)) throw new Error('Sueldo duplicado o no válido.');
    months.add(scenario.month);
    assertAmount(scenario.salary);
    assertAmount(scenario.extra);
    if (!Array.isArray(scenario.payments) || scenario.payments.length > 1000) throw new Error('Pagos no válidos.');
    const ids = new Set();
    const sources = new Set();
    for (const payment of scenario.payments) {
      if (!payment || typeof payment.id !== 'string' || !payment.id || ids.has(payment.id) || typeof payment.name !== 'string' || !payment.name.trim() || payment.name.length > 100 || payment.sourceId !== null && (typeof payment.sourceId !== 'string' || !payment.sourceId || sources.has(payment.sourceId))) throw new Error('Pago simulado no válido.');
      ids.add(payment.id);
      if (payment.sourceId !== null) sources.add(payment.sourceId);
      assertAmount(payment.amount, false);
    }
    const totals = simulationTotals(scenario);
    if (!Number.isSafeInteger(totals.income) || !Number.isSafeInteger(totals.payments)) throw new Error('El monto total es demasiado grande.');
  }
  return document;
}
module.exports = {
  allocatedInstallments,
  simulationSalaryDate,
  simulationMonth,
  emptyScenario,
  remainingInstallments,
  toggleSimulatedPayment,
  distributeSimulatedPayment,
  simulationTotals,
  validateSimulation
};
