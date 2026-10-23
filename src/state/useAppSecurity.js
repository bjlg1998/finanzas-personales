import { appNotice } from '../services/appNotice';
import { useCallback, useEffect, useState } from 'react';
import { authenticate } from '../services/biometrics';
export function useAppSecurity(enabled, loaded) {
  const [locked, setLocked] = useState(false);
  const [ready, setReady] = useState(false);
  const unlock = useCallback(async () => {
    try {
      const result = await authenticate();
      if (result.unavailable) {
        appNotice.show('Biometría no disponible', 'Configura la biometría en los ajustes del teléfono.');
        return;
      }
      setLocked(!result.success);
      setReady(true);
    } catch {
      appNotice.show('No se pudo autenticar', 'Intenta nuevamente con la huella o la clave del teléfono.');
    }
  }, []);
  useEffect(() => {
    if (loaded && enabled) {
      setLocked(true);
      setReady(false);
      unlock();
    }
  }, [loaded, enabled, unlock]);
  return {
    locked: enabled && (!ready || locked),
    unlock
  };
}
