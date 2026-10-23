import { appNotice } from '../services/appNotice';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { synchronizePaymentNotifications } from '../services/notifications';
export function usePaymentNotifications(data, loaded) {
  const warned = useRef(false);
  useEffect(() => {
    if (!loaded) return;
    let disposed = false;
    const sync = () => synchronizePaymentNotifications(data).then(() => {
      warned.current = false;
    }).catch(() => {
      if (disposed || warned.current) return;
      warned.current = true;
      appNotice.show('Revisa tus recordatorios', 'Tus pagos están guardados, pero no se pudieron actualizar todos los avisos. Se intentará nuevamente al cambiar el plan o volver a abrir la app.');
    });
    sync();
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') sync();
    });
    return () => {
      disposed = true;
      subscription.remove();
    };
  }, [data.fixed, data.activeCycleStart, loaded]);
}
