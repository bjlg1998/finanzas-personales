import { useEffect, useState } from 'react';
import { AppState, Linking } from 'react-native';
import { appNotice } from '../services/appNotice';
import { paymentNotificationPermission, requestPaymentNotifications, synchronizePaymentNotifications } from '../services/notifications';
export function useNotificationSettings(data) {
  const [permission, setPermission] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    const refresh = () => paymentNotificationPermission().then(status => {
      if (active) setPermission(status);
    }).catch(() => {});
    refresh();
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') refresh();
    });
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  const configure = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const granted = await requestPaymentNotifications();
      setPermission(granted ? 'granted' : 'denied');
      if (granted) {
        await synchronizePaymentNotifications(data);
        appNotice.show('Recordatorios actualizados', 'Un aviso a las 9:00 a. m. el día anterior y otro el día del pago, solo si hay saldo pendiente.', undefined, {
          tone: 'success'
        });
      } else {
        appNotice.show('Notificaciones desactivadas', 'Permite las notificaciones en los ajustes del teléfono. Android también puede retrasarlas por ahorro de batería.', [{
          text: 'Cancelar',
          style: 'cancel'
        }, {
          text: 'Abrir ajustes',
          onPress: () => Linking.openSettings().catch(() => {})
        }]);
      }
    } catch {
      appNotice.show('No se pudieron actualizar los avisos', 'Tus gastos siguen guardados. Revisa los permisos e intenta de nuevo.');
    } finally {
      setBusy(false);
    }
  };
  return {
    permission,
    busy,
    configure
  };
}
