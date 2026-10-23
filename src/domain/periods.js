const {
  cycleFor,
  shortDate
} = require('./dates');
const {
  fixedPaidAmount
} = require('./payments');
const {
  totalIncome
} = require('./income');
/** @param {Date} start @param {number} payDay */
function nextSalaryDate(start, payDay) {
  const next = new Date(start.getFullYear(), start.getMonth() + 1, 1);
  return new Date(next.getFullYear(), next.getMonth(), Math.min(payDay || 31, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()));
}
/** @param {import('./models').FinanceData} data @param {Date} [now] */
function closeSalaryPeriod(data, now = new Date()) {
  const cycle = cycleFor(now, data.activeCycleStart);
  const income = totalIncome(data);
  const variableSpent = data.expenses.filter(item => item.period === cycle.id).reduce((sum, item) => sum + item.amount, 0);
  const paid = data.fixed.filter(item => item.active !== false).reduce((sum, item) => sum + fixedPaidAmount(item), 0);
  const month = cycle.start.toLocaleDateString('es-CO', {
    month: 'long',
    year: 'numeric'
  });
  const snapshot = {
    id: `${cycle.id}-${now.getTime()}`,
    label: `Sueldo de ${month} · ${shortDate(cycle.start)}`,
    income,
    salary: data.salary,
    extraIncome: data.extraIncome || 0,
    extraIncomeLabel: data.extraIncomeLabel || '',
    spent: paid + variableSpent,
    saved: Math.max(0, income - paid - variableSpent),
    fixed: data.fixed.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      amount: item.amount,
      paidAmount: fixedPaidAmount(item),
      active: item.active !== false
    }))
  };
  return {
    ...data,
    carry: 0,
    extraIncome: data.extraIncomeRecurring ? data.extraIncome || 0 : 0,
    activeCycleStart: nextSalaryDate(cycle.start, data.payDay).toISOString(),
    planningNext: true,
    periods: [snapshot, ...data.periods],
    fixed: data.fixed.map(item => ({
      ...item,
      active: true,
      paid: false,
      paidAmount: 0,
      installmentAdvanced: false,
      notificationIds: []
    }))
  };
}
module.exports = {
  nextSalaryDate,
  closeSalaryPeriod
};
