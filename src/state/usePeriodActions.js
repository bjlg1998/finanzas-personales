import { useCallback } from 'react';
import { closeSalaryPeriod } from '../domain/periods';
export function usePeriodActions({
  selectedFixed,
  setConfirmDialog,
  setData,
  closeSheet,
  setTab
}) {
  const deleteFixed = () => {
    if (!selectedFixed) return;
    setConfirmDialog({
      title: 'Eliminar gasto fijo',
      message: `Se eliminará ${selectedFixed.name} y también se cancelarán sus recordatorios.`,
      confirmLabel: 'Sí, eliminar',
      danger: true,
      onConfirm: async () => {
        setData(d => ({
          ...d,
          fixed: d.fixed.filter(x => x.id !== selectedFixed.id)
        }));
        setConfirmDialog(null);
        closeSheet();
      }
    });
  };
  const removeExpense = useCallback(id => setConfirmDialog({
    title: 'Eliminar movimiento',
    message: 'Este gasto desaparecerá del período y el dinero volverá a tu disponible.',
    confirmLabel: 'Eliminar gasto',
    danger: true,
    onConfirm: () => {
      setData(d => ({
        ...d,
        expenses: d.expenses.filter(x => x.id !== id)
      }));
      setConfirmDialog(null);
    }
  }), [setConfirmDialog, setData]);
  const endPeriod = () => setConfirmDialog({
    title: 'Cerrar este sueldo',
    message: 'Guardaremos los pagos realizados y los pendientes en el historial. El siguiente plan comienza con su propio sueldo, sin trasladar dinero. Tus gastos fijos se repetirán con sus pagos reiniciados.',
    confirmLabel: 'Cerrar plan',
    onConfirm: () => {
      setData(d => closeSalaryPeriod(d));
      setConfirmDialog(null);
      setTab('plan');
    }
  });
  return {
    deleteFixed,
    removeExpense,
    endPeriod
  };
}
