/**
 * @param {{amount: number, name: string, dueDay: number,
 * installmentsTotal: number, installmentsPaid: number, deadlineDay: number|null}} draft
 * @returns {string|null}
 */
function validateFixedExpense(draft) {
  if (!Number.isSafeInteger(draft.amount) || draft.amount <= 0 || !draft.name.trim() || !Number.isInteger(draft.dueDay) || draft.dueDay < 1 || draft.dueDay > 31) {
    return 'Agrega nombre, valor y un día de pago entre 1 y 31.';
  }
  if (!Number.isInteger(draft.installmentsTotal) || draft.installmentsTotal < 0 || !Number.isInteger(draft.installmentsPaid) || draft.installmentsPaid < 0 || draft.installmentsTotal === 0 && draft.installmentsPaid !== 0 || draft.installmentsTotal > 0 && draft.installmentsPaid >= draft.installmentsTotal) {
    return 'Usa cuotas enteras no negativas y un total mayor que las cuotas pagadas.';
  }
  if (draft.deadlineDay !== null && (!Number.isInteger(draft.deadlineDay) || draft.deadlineDay < 1 || draft.deadlineDay > 31)) {
    return 'El vencimiento debe ser un día entero entre 1 y 31.';
  }
  return null;
}
module.exports = {
  validateFixedExpense
};
