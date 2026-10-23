const SCHEMA_VERSION = 1;
/** @param {unknown} value @returns {asserts value is Record<string, unknown>} */
function record(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('El archivo de datos contiene un registro no válido.');
}
/** @param {unknown} value @param {string} field */
function amount(value, field) {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) throw new Error(`El monto ${field} no es válido.`);
}
/** @param {unknown} value @param {string} field */
function date(value, field) {
  if (typeof value !== 'string' || !value.trim() || Number.isNaN(new Date(value).getTime())) throw new Error(`La fecha ${field} no es válida.`);
  const parts = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/);
  if (!parts || Number(parts[2]) < 1 || Number(parts[2]) > 12 || Number(parts[3]) < 1 || Number(parts[3]) > new Date(Number(parts[1]), Number(parts[2]), 0).getDate()) throw new Error(`La fecha ${field} no existe en el calendario.`);
}
/** @param {unknown} value @param {string} field @param {boolean} [requireIds] @returns {Record<string, unknown>[]} */
function collection(value, field, requireIds = true) {
  if (value == null) return [];
  if (!Array.isArray(value)) throw new Error(`La colección ${field} no es válida.`);
  const ids = new Set();
  return value.map(item => {
    record(item);
    if (requireIds || item.id != null) {
      if (typeof item.id !== 'string' || !item.id.trim() || ids.has(item.id)) throw new Error(`Hay identificadores ausentes o repetidos en ${field}.`);
      ids.add(item.id);
    }
    return item;
  });
}
/** @param {Record<string, unknown>} item */
function expense(item) {
  if (typeof item.name !== 'string') throw new Error('El nombre del gasto no es válido.');
  amount(item.amount, 'gasto');
  if (item.paidAmount != null) {
    amount(item.paidAmount, 'abono');
    if (Number(item.paidAmount) > Number(item.amount)) throw new Error('El abono supera el valor del gasto.');
  }
  for (const field of ['paid', 'active', 'installmentAdvanced']) {
    if (item[field] != null && typeof item[field] !== 'boolean') throw new Error(`El estado ${field} no es válido.`);
  }
  for (const field of ['installmentsTotal', 'installmentsPaid']) {
    if (item[field] != null) amount(item[field], field);
  }
  if (Number(item.installmentsPaid || 0) > Number(item.installmentsTotal || 0)) throw new Error('Las cuotas pagadas superan las cuotas totales.');
  for (const field of ['dueDay', 'deadlineDay']) {
    // Zero dueDay is a legacy placeholder for salary-day payments, never a deadline.
    if (field === 'dueDay' && item[field] === 0 && item.paymentTiming !== 'other') continue;
    if (item[field] != null && (!Number.isInteger(item[field]) || Number(item[field]) < 1 || Number(item[field]) > 31)) throw new Error(`El día ${field} no es válido.`);
  }
  if (item.paymentTiming != null && !['payday', 'nextday', 'other'].includes(String(item.paymentTiming))) throw new Error('La fecha planeada no es válida.');
  if (item.date != null) date(item.date, 'movimiento');
  if (item.period != null && (typeof item.period !== 'string' || !/^\d{4}-(?:[1-9]|1[0-2])$/.test(item.period))) throw new Error('El período del movimiento no es válido.');
}
/** Validates untrusted storage without silently coercing or deleting financial values.
 * @template T @param {T} data @returns {T}
 */
function validateFinanceData(data) {
  record(data);
  if (data.schemaVersion != null && (!Number.isSafeInteger(data.schemaVersion) || Number(data.schemaVersion) < 0)) throw new Error('La versión de datos no es válida.');
  if (Number(data.schemaVersion) > SCHEMA_VERSION) throw Object.assign(new Error('Estos datos requieren una versión más reciente de la app.'), {
    code: 'FUTURE_SCHEMA'
  });
  for (const field of ['salary', 'carry', 'goal', 'extraIncome']) if (data[field] != null) amount(data[field], field);
  if (!Number.isSafeInteger(Number(data.salary || 0) + Number(data.carry || 0) + Number(data.extraIncome || 0))) throw new Error('El ingreso total excede el límite admitido.');
  if (data.extraIncomeLabel != null && typeof data.extraIncomeLabel !== 'string') throw new Error('La descripción del ingreso extra no es válida.');
  for (const field of ['extraIncomeRecurring', 'biometric']) if (data[field] != null && typeof data[field] !== 'boolean') throw new Error(`El valor ${field} no es válido.`);
  if (data.payDay != null && data.payDay !== 30 && data.payDay !== 31) throw new Error('El día de sueldo no es válido.');
  const fixed = collection(data.fixed, 'fixed');
  const expenses = collection(data.expenses, 'expenses');
  for (const item of [...fixed, ...expenses]) expense(item);
  const committed = [...fixed.filter(item => item.active !== false), ...expenses].reduce((sum, item) => sum + Number(item.amount), Number(data.goal || 0));
  if (!Number.isSafeInteger(committed)) throw new Error('El total de gastos excede el límite admitido.');
  for (const item of collection(data.periods, 'periods')) {
    if (typeof item.label !== 'string') throw new Error('Hay un período con datos no válidos.');
    for (const field of ['income', 'spent', 'saved', 'salary', 'extraIncome']) if (item[field] != null) amount(item[field], field);
    for (const snapshot of collection(item.fixed, 'historial de gastos', false)) expense(snapshot);
  }
  if (data.activeCycleStart != null) date(data.activeCycleStart, 'plan');
  return data;
}
module.exports = {
  SCHEMA_VERSION,
  validateFinanceData
};
