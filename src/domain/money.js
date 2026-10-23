const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
});
/** @param {unknown} n */
const money = n => copFormatter.format(Number(n || 0));
/** @param {unknown} value */
const parseMoney = value => Number(String(value).replace(/\D/g, '')) || 0;
/** @param {unknown} value */
const formatMoneyInput = value => {
  const digits = String(value || '').replace(/\D/g, '');
  return digits ? new Intl.NumberFormat('es-CO').format(Number(digits)) : '';
};
module.exports = {
  money,
  parseMoney,
  formatMoneyInput
};
