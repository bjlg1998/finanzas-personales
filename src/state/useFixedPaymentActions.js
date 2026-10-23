import { appNotice } from '../services/appNotice';
import { useCallback } from 'react';
import { parseMoney } from '../domain/money';
import { addFixedPayment as recordFixedPayment, setFixedPaymentTotal } from '../domain/payments';
export function useFixedPaymentActions({
  setSelectedFixed,
  setAmount,
  setSheet,
  selectedFixed,
  amount,
  setData,
  closeSheet
}) {
  const openFixedPayment = useCallback(item => {
    setSelectedFixed(item);
    setAmount('');
    setSheet('payFixed');
  }, [setAmount, setSelectedFixed, setSheet]);
  const addFixedPayment = () => {
    if (!selectedFixed) return;
    try {
      const updated = recordFixedPayment(selectedFixed, parseMoney(amount));
      setData(d => ({
        ...d,
        fixed: d.fixed.map(item => item.id === selectedFixed.id ? setFixedPaymentTotal(item, updated.paidAmount) : item)
      }));
      closeSheet();
    } catch (error) {
      appNotice.show('Revisa el pago', error.message);
    }
  };
  const correctFixedPayment = () => {
    if (!selectedFixed) return;
    try {
      const value = parseMoney(amount);
      setFixedPaymentTotal(selectedFixed, value);
      setData(d => ({
        ...d,
        fixed: d.fixed.map(item => item.id === selectedFixed.id ? setFixedPaymentTotal(item, value) : item)
      }));
      closeSheet();
    } catch (error) {
      appNotice.show('Revisa la corrección', error.message);
    }
  };
  return {
    openFixedPayment,
    addFixedPayment,
    correctFixedPayment
  };
}
