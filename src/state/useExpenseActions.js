import { appNotice } from '../services/appNotice';
import { useCallback } from 'react';
import { parseMoney, formatMoneyInput } from '../domain/money';
export function useExpenseActions({
  amount,
  setData,
  name,
  category,
  cycle,
  closeSheet,
  setSelectedExpense,
  setAmount,
  setName,
  setCategory,
  setSheet,
  selectedExpense
}) {
  const addExpense = () => {
    const value = parseMoney(amount);
    if (!Number.isSafeInteger(value) || value <= 0) return appNotice.show('Falta el valor', 'Escribe cuánto gastaste.');
    setData(d => ({
      ...d,
      expenses: [{
        id: Date.now().toString(),
        amount: value,
        name: name || category,
        category,
        budgetGroup: 'auto',
        date: new Date().toISOString(),
        period: cycle.id
      }, ...d.expenses]
    }));
    closeSheet();
  };
  const openExpenseEditor = useCallback(item => {
    setSelectedExpense(item);
    setAmount(formatMoneyInput(item.amount));
    setName(item.name || '');
    setCategory(item.category || 'Otros');
    setSheet('editExpense');
  }, [setAmount, setCategory, setName, setSelectedExpense, setSheet]);
  const updateExpense = () => {
    const value = parseMoney(amount);
    if (!selectedExpense || !Number.isSafeInteger(value) || value <= 0) return appNotice.show('Falta el valor', 'Escribe cuánto gastaste.');
    setData(d => ({
      ...d,
      expenses: d.expenses.map(item => item.id === selectedExpense.id ? {
        ...item,
        amount: value,
        name: name.trim() || category,
        category,
        budgetGroup: 'auto'
      } : item)
    }));
    closeSheet();
  };
  return {
    addExpense,
    openExpenseEditor,
    updateExpense
  };
}
