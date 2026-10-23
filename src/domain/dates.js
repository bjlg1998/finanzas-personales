/** @param {Date} [date] @param {string|null} [forcedStart] */
function cycleFor(date = new Date(), forcedStart = null) {
  if (forcedStart) {
    const start = new Date(forcedStart);
    const nextPayday = new Date(start.getFullYear(), start.getMonth() + 2, 0);
    const end = new Date(nextPayday);
    end.setDate(end.getDate() - 1);
    return {
      start,
      end,
      id: `${start.getFullYear()}-${start.getMonth() + 1}`
    };
  }
  const y = date.getFullYear();
  const m = date.getMonth();
  /** @param {number} year @param {number} month */
  const payday = (year, month) => new Date(year, month + 1, 0);
  const thisPayday = payday(y, m);
  const daysToPayday = Math.ceil((thisPayday.getTime() - date.getTime()) / 86400000);
  // Up to three days before payday, prepare the next month's budget.
  // During the rest of the month, keep showing the active budget.
  const start = date >= thisPayday || daysToPayday <= 3 ? thisPayday : payday(y, m - 1);
  const nextPayday = payday(start.getFullYear(), start.getMonth() + 1);
  const end = new Date(nextPayday);
  end.setDate(end.getDate() - 1);
  return {
    start,
    end,
    id: `${start.getFullYear()}-${start.getMonth() + 1}`
  };
}
/** @param {Date} d */
const shortDate = d => d.toLocaleDateString('es-CO', {
  day: 'numeric',
  month: 'short'
});
/** @param {Date} start @param {Pick<import('./models').FixedExpense,'paymentTiming'|'dueDay'>} item */
const planPaymentDate = (start, item) => {
  if (item.paymentTiming === 'payday') return new Date(start);
  if (item.paymentTiming === 'nextday') return new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
  const month = new Date(start.getFullYear(), start.getMonth() + 1, 1);
  return new Date(month.getFullYear(), month.getMonth(), Math.min(item.dueDay || 1, new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()));
};
module.exports = {
  cycleFor,
  shortDate,
  planPaymentDate
};
