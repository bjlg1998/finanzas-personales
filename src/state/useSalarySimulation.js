import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createSimulationRepository } from '../services/simulationRepository';
import { validateSimulation } from '../domain/simulation';

// Keep writes ordered even if the screen is closed and reopened during a write.
const repository = createSimulationRepository(AsyncStorage);
export function useSalarySimulation() {
  const [simulation, setSimulation] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const latest = useRef(null);
  const revision = useRef(0);
  const load = useCallback(async () => {
    setStatus('loading');
    setError('');
    try {
      const value = await repository.load();
      latest.current = value;
      setSimulation(value);
      setStatus('saved');
    } catch {
      setStatus('loadError');
      setError('No se pudo leer la simulación guardada. No la hemos reemplazado.');
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  const persist = useCallback(async value => {
    const current = ++revision.current;
    setStatus('saving');
    try {
      await repository.save(value);
      if (current === revision.current) setStatus('saved');
    } catch {
      if (current === revision.current) {
        setStatus('saveError');
        setError('No se guardaron los últimos cambios. Reintenta antes de cerrar.');
      }
    }
  }, []);
  const change = useCallback(update => {
    if (!latest.current) return;
    try {
      const next = validateSimulation(update(latest.current));
      latest.current = next;
      setSimulation(next);
      setError('');
      persist(next);
    } catch (failure) {
      setError(failure.message);
    }
  }, [persist]);
  const retry = useCallback(() => {
    if (latest.current) {
      setError('');
      persist(latest.current);
    } else load();
  }, [load, persist]);
  return {
    simulation,
    status,
    error,
    change,
    retry
  };
}
