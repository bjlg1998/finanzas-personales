const PLAN_ORDER_OPTIONS = [['added', 'Orden de registro'], ['name', 'Nombre · A–Z'], ['amountDesc', 'Mayor valor primero'], ['amountAsc', 'Menor valor primero'], ['date', 'Fecha de pago'], ['category', 'Categoría']];
/** @param {import('./models').FixedExpense[]} items @param {string} filter @param {string} search @param {string} order @param {(item:import('./models').FixedExpense)=>Date} dateFor */
function orderedPlan(items, filter, search, order, dateFor) {
  const query = search.trim().toLocaleLowerCase('es');
  const {
    fixedPaidAmount
  } = require('./payments');
  const result = items.filter(item => {
    const paid = fixedPaidAmount(item) >= item.amount;
    return (filter === 'all' || (filter === 'paid' ? paid : !paid)) && item.name.toLocaleLowerCase('es').includes(query);
  });
  /** @type {Record<string,(a:import('./models').FixedExpense,b:import('./models').FixedExpense)=>number>} */
  const comparators = {
    name: (a, b) => a.name.localeCompare(b.name, 'es'),
    amountDesc: (a, b) => b.amount - a.amount,
    amountAsc: (a, b) => a.amount - b.amount,
    date: (a, b) => +dateFor(a) - +dateFor(b),
    category: (a, b) => (a.category || 'Otros').localeCompare(b.category || 'Otros', 'es')
  };
  const compare = comparators[order];
  return compare ? result.sort(compare) : result;
}
module.exports = {
  PLAN_ORDER_OPTIONS,
  orderedPlan
};
