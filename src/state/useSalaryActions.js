import { appNotice } from '../services/appNotice';
import { parseMoney } from '../domain/money';
export function useSalaryActions({
  amount,
  dueDay,
  data,
  cycle,
  setData,
  closeSheet
}) {
  const saveSetup = (extra = {}) => {
    const value = parseMoney(amount);
    if (!Number.isSafeInteger(value) || value <= 0) return appNotice.show('Falta tu sueldo', 'Ingresa un sueldo válido en pesos.');
    const extraIncome = extra.amount === undefined ? data.extraIncome || 0 : parseMoney(extra.amount);
    if (!Number.isSafeInteger(extraIncome) || extraIncome < 0 || !Number.isSafeInteger(value + extraIncome)) return appNotice.show('Revisa el ingreso extra', 'Ingresa un monto válido en pesos.');
    const payday = Number(dueDay) || data.payDay;
    if (![30, 31].includes(payday)) return appNotice.show('Revisa la fecha', 'Selecciona el día 30 o 31.');
    const start = new Date(cycle.start.getFullYear(), cycle.start.getMonth(), Math.min(payday, new Date(cycle.start.getFullYear(), cycle.start.getMonth() + 1, 0).getDate()));
    setData(d => ({
      ...d,
      salary: value,
      extraIncome,
      extraIncomeLabel: typeof extra.label === 'string' ? extra.label.trim() : d.extraIncomeLabel || '',
      extraIncomeRecurring: typeof extra.recurring === 'boolean' ? extra.recurring : Boolean(d.extraIncomeRecurring),
      payDay: payday,
      activeCycleStart: start.toISOString()
    }));
    closeSheet();
  };
  return {
    saveSetup
  };
}
