import { appNotice } from '../services/appNotice';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { seed } from '../data/defaults';
import { createFinanceRepository } from '../services/financeRepository';
const FinanceContext = createContext(null);
export function FinanceProvider({
  children
}) {
  const repository = useRef(null);
  if (!repository.current) repository.current = createFinanceRepository(AsyncStorage);
  const [data, setData] = useState(seed);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const latest = useRef(data);
  latest.current = data;
  const saveErrorShown = useRef(false);
  const retrySave = useCallback(() => repository.current.save(latest.current).then(() => {
    saveErrorShown.current = false;
  }).catch(() => {
    appNotice.show('No se pudo guardar', 'Tus cambios siguen en memoria. Reintenta guardar antes de cerrar la app.', [{
      text: 'Reintentar',
      onPress: retrySave
    }]);
  }), []);
  const reload = useCallback(async () => {
    setLoadError(null);
    try {
      const result = await repository.current.load();
      setData(result.data);
      setLoaded(true);
      if (result.recovered) appNotice.show('Datos recuperados', 'Se recuperó la última copia local válida. Revisa los movimientos más recientes.');
    } catch {
      setLoadError('No se pudieron cargar tus datos. No se han reemplazado ni borrado.');
    }
  }, []);
  useEffect(() => {
    reload();
  }, [reload]);
  useEffect(() => {
    if (!loaded) return;
    repository.current.save(data).catch(() => {
      if (saveErrorShown.current) return;
      saveErrorShown.current = true;
      appNotice.show('No se pudo guardar', 'Tus cambios siguen en memoria. Reintenta guardar antes de cerrar la app.', [{
        text: 'Reintentar',
        onPress: retrySave
      }]);
    });
  }, [data, loaded, retrySave]);
  return <FinanceContext.Provider value={{
    data,
    setData,
    loaded,
    loadError,
    reload
  }}>{children}</FinanceContext.Provider>;
}
export function useFinanceData() {
  const value = useContext(FinanceContext);
  if (!value) throw new Error('FinanceProvider is required');
  return value;
}
