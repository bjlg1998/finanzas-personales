import { useEffect, useRef } from 'react';
import { expenseFromNotification } from '../domain/reminders';
import { observePaymentNotificationResponses, clearPaymentNotificationResponse } from '../services/notifications';
export function useNotificationNavigation(data, loaded, openPayment, setTab) {
  const latest = useRef(data);
  latest.current = data;
  const handled = useRef(null);
  useEffect(() => {
    if (!loaded) return;
    return observePaymentNotificationResponses(response => {
      const id = response.notification.request.identifier;
      if (handled.current === id) return;
      handled.current = id;
      const item = expenseFromNotification(response, latest.current);
      if (item) {
        setTab('plan');
        openPayment(item);
      }
      clearPaymentNotificationResponse().catch(() => {});
    });
  }, [loaded, openPayment, setTab]);
}
