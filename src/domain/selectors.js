const {
  categoryAmountsFor,
  PAYMENT_CATEGORIES
} = require('./categories');
const {
  planPaymentDate
} = require('./dates');
const {
  fixedPaidAmount
} = require('./payments');
const {
  totalIncome
} = require('./income');
/** @param {import('./models').FinanceData} data @param {import('./models').Cycle} cycle */
function selectPlanSummary(data, cycle) {
  const currentExpenses = data.expenses.filter(item => item.period === cycle.id);
  const variableSpent = currentExpenses.reduce((sum, item) => sum + item.amount, 0);
  const activeFixed = data.fixed.filter(item => item.active !== false);
  const fixedTotal = activeFixed.reduce((sum, item) => sum + item.amount, 0);
  const paidFixed = activeFixed.reduce((sum, item) => sum + fixedPaidAmount(item), 0);
  const totalBase = totalIncome(data);
  const available = totalBase - fixedTotal - variableSpent - data.goal;
  const amounts = categoryAmountsFor(activeFixed, currentExpenses, data.goal);
  const denominator = Math.max(totalBase, fixedTotal + variableSpent + data.goal, 1);
  const distribution = Object.entries(PAYMENT_CATEGORIES).map(([label, color]) => ({
    label,
    color,
    amount: amounts[label] || 0
  })).filter(part => part.amount > 0).map(part => ({
    ...part,
    percent: totalBase ? part.amount / totalBase * 100 : 0,
    width: part.amount / denominator * 100
  }));
  if (available > 0) distribution.push({
    label: 'Disponible',
    color: '#24BE83',
    amount: available,
    percent: totalBase ? available / totalBase * 100 : 0,
    width: available / denominator * 100
  });
  const pendingFixed = activeFixed.filter(item => fixedPaidAmount(item) < item.amount).sort((a, b) => planPaymentDate(cycle.start, a).getTime() - planPaymentDate(cycle.start, b).getTime() || a.name.localeCompare(b.name));
  const completedFixed = activeFixed.filter(item => fixedPaidAmount(item) >= item.amount);
  return {
    currentExpenses,
    variableSpent,
    activeFixed,
    fixedTotal,
    paidFixed,
    totalBase,
    available,
    distribution,
    pendingFixed,
    completedFixed,
    pendingTotal: Math.max(0, fixedTotal - paidFixed)
  };
}
/** @param {import('./models').FixedExpense} item @param {Date} start @param {Date} [now] */
function paymentStatusFor(item, start, now = new Date()) {
  if (item.active === false) return {
    text: 'Sin incluir',
    tone: 'muted'
  };
  if (fixedPaidAmount(item) >= item.amount) return {
    text: 'Pagado',
    tone: 'mint'
  };
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const date = planPaymentDate(start, item);
  date.setHours(0, 0, 0, 0);
  const deadline = item.deadlineDay ? planPaymentDate(start, {
    dueDay: item.deadlineDay
  }) : null;
  const partial = fixedPaidAmount(item) ? ' · Pago parcial' : '';
  if (deadline && deadline < today) return {
    text: 'Factura vencida' + partial,
    tone: 'danger'
  };
  if (date < today) return {
    text: (deadline ? 'Pago planeado atrasado' : 'Vencido') + partial,
    tone: 'danger'
  };
  if (+date === +today) return {
    text: 'Hoy' + partial,
    tone: 'gold'
  };
  return {
    text: 'Próximo' + partial,
    tone: 'upcoming'
  };
}
module.exports = {
  selectPlanSummary,
  paymentStatusFor
};
