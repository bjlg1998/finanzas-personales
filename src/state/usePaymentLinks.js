import { appNotice } from '../services/appNotice';
import { useCallback, useEffect, useRef } from 'react';
import { Linking } from 'react-native';
import { copyText } from '../services/nativePhone';
export function usePaymentLinks({
  setReferenceCopied
}) {
  const copiedTimer = useRef(null);
  useEffect(() => () => clearTimeout(copiedTimer.current), []);
  const openPaymentUrl = useCallback(async rawUrl => {
    if (!rawUrl) return;
    const url = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    try {
      await Linking.openURL(url);
    } catch {
      appNotice.show('No se pudo abrir el enlace', 'Revisa que la dirección esté escrita correctamente.');
    }
  }, []);
  const copyPaymentReference = useCallback(async reference => {
    try {
      await copyText(reference);
      clearTimeout(copiedTimer.current);
      setReferenceCopied(true);
      copiedTimer.current = setTimeout(() => setReferenceCopied(false), 1600);
    } catch {
      appNotice.show('No se pudo copiar', 'Intenta copiar la referencia nuevamente.');
    }
  }, [setReferenceCopied]);
  return {
    openPaymentUrl,
    copyPaymentReference
  };
}
