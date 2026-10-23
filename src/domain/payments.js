/** Money is represented as whole Colombian pesos, never floating point cents. */
/** @param {number} value @param {boolean} [allowZero] */
function assertAmount(value, allowZero = true) {
  if (!Number.isSafeInteger(value) || value < 0 || !allowZero && value === 0) {
    throw new Error('Ingresa un monto válido en pesos, sin decimales.');
  }
}
/** @param {import('./models').FixedExpense} expense */
function fixedPaidAmount(expense) {
  return Math.max(0, Math.min(expense.amount, expense.paidAmount ?? (expense.paid ? expense.amount : 0)));
}
/** @param {import('./models').FixedExpense} expense @param {number} total */
function setFixedPaymentTotal(expense, total) {
  assertAmount(total);
  assertAmount(expense.amount, false);
  if (total > expense.amount) throw new Error('El pago no puede superar el valor del gasto.');
  const complete = total === expense.amount;
  const installmentBase = Math.max(0, (expense.installmentsPaid || 0) - (expense.installmentAdvanced ? 1 : 0));
  const advance = Boolean(complete && expense.installmentsTotal && installmentBase < expense.installmentsTotal);
  return {
    ...expense,
    paidAmount: total,
    paid: complete,
    installmentsPaid: expense.installmentsTotal ? installmentBase + Number(advance) : expense.installmentsPaid || 0,
    installmentAdvanced: advance
  };
}
/** @param {import('./models').FixedExpense} expense @param {number} amount */
function addFixedPayment(expense, amount) {
  assertAmount(amount, false);
  return setFixedPaymentTotal(expense, fixedPaidAmount(expense) + amount);
}
/** @param {import('./models').FixedExpense} expense @param {Partial<import('./models').FixedExpense>} details */
function reviseFixedExpense(expense, details) {
  const updated = {
    ...expense,
    ...details
  };
  return setFixedPaymentTotal(updated, Math.min(fixedPaidAmount(expense), updated.amount));
}
module.exports = {
  assertAmount,
  fixedPaidAmount,
  setFixedPaymentTotal,
  addFixedPayment,
  reviseFixedExpense
};
