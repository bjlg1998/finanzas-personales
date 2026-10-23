import { appNotice } from '../services/appNotice';
import { useCallback } from 'react';
import { parseMoney, formatMoneyInput } from '../domain/money';
import { reviseFixedExpense } from '../domain/payments';
import { requestPaymentNotifications } from '../services/notifications';
import { validateFixedExpense } from '../domain/expenseValidation';
export function useFixedExpenseActions({
  amount,
  paymentTiming,
  dueDay,
  installmentsTotal,
  installmentsPaid,
  name,
  deadlineDay,
  setData,
  fixedCategory,
  paymentUrl,
  paymentReference,
  closeSheet,
  selectedFixed,
  setName,
  setAmount,
  setDueDay,
  setFixedCategory,
  setCategoryManuallySet,
  setPaymentTiming,
  setDeadlineDay,
  setInstallmentsTotal,
  setInstallmentsPaid,
  setPaymentUrl,
  setPaymentReference,
  setSheet
}) {
  const addFixed = async () => {
    const value = parseMoney(amount);
    const day = paymentTiming === 'other' ? Number(dueDay) : 1;
    const totalInstallments = Number(installmentsTotal) || 0;
    const alreadyPaid = Number(installmentsPaid) || 0;
    const error = validateFixedExpense({
      amount: value,
      name,
      dueDay: day,
      installmentsTotal: totalInstallments,
      installmentsPaid: alreadyPaid,
      deadlineDay: deadlineDay ? Number(deadlineDay) : null
    });
    if (error) return appNotice.show('Revisa los datos', error);
    await requestPaymentNotifications().catch(() => false);
    setData(d => ({
      ...d,
      fixed: [...d.fixed, {
        id: Date.now().toString(),
        name: name.trim(),
        amount: value,
        dueDay: day,
        category: fixedCategory,
        budgetGroup: 'auto',
        paymentTiming,
        deadlineDay: Number(deadlineDay) || null,
        paid: false,
        paidAmount: 0,
        notificationIds: [],
        active: true,
        installmentsTotal: totalInstallments,
        installmentsPaid: alreadyPaid,
        installmentAdvanced: false,
        paymentUrl: paymentUrl.trim(),
        paymentReference: paymentReference.trim()
      }]
    }));
    closeSheet();
  };
  const openFixedEditor = useCallback(() => {
    if (!selectedFixed) return;
    setName(selectedFixed.name || '');
    setAmount(formatMoneyInput(selectedFixed.amount));
    setDueDay(String(selectedFixed.dueDay || ''));
    setFixedCategory(selectedFixed.category || 'Otros');
    setCategoryManuallySet(false);
    setPaymentTiming(selectedFixed.paymentTiming || 'other');
    setDeadlineDay(selectedFixed.deadlineDay ? String(selectedFixed.deadlineDay) : '');
    setInstallmentsTotal(selectedFixed.installmentsTotal ? String(selectedFixed.installmentsTotal) : '');
    setInstallmentsPaid(selectedFixed.installmentsPaid ? String(selectedFixed.installmentsPaid) : '');
    setPaymentUrl(selectedFixed.paymentUrl || '');
    setPaymentReference(selectedFixed.paymentReference || '');
    setSheet('editFixed');
  }, [selectedFixed, setAmount, setCategoryManuallySet, setDeadlineDay, setDueDay, setFixedCategory, setInstallmentsPaid, setInstallmentsTotal, setName, setPaymentReference, setPaymentTiming, setPaymentUrl, setSheet]);
  const updateFixed = async () => {
    const value = parseMoney(amount);
    const day = paymentTiming === 'other' ? Number(dueDay) : 1;
    const totalInstallments = Number(installmentsTotal) || 0;
    const alreadyPaid = Number(installmentsPaid) || 0;
    if (!selectedFixed) return;
    const error = validateFixedExpense({
      amount: value,
      name,
      dueDay: day,
      installmentsTotal: totalInstallments,
      installmentsPaid: alreadyPaid,
      deadlineDay: deadlineDay ? Number(deadlineDay) : null
    });
    if (error) return appNotice.show('Revisa los datos', error);
    setData(d => ({
      ...d,
      fixed: d.fixed.map(item => item.id === selectedFixed.id ? reviseFixedExpense(item, {
        name: name.trim(),
        amount: value,
        category: fixedCategory,
        budgetGroup: 'auto',
        dueDay: day,
        paymentTiming,
        deadlineDay: Number(deadlineDay) || null,
        installmentsTotal: totalInstallments,
        installmentsPaid: alreadyPaid,
        paymentUrl: paymentUrl.trim(),
        paymentReference: paymentReference.trim(),
        notificationIds: []
      }) : item)
    }));
    closeSheet();
  };
  return {
    addFixed,
    openFixedEditor,
    updateFixed
  };
}
