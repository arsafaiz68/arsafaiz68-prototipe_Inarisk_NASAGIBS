import { useEffect, useState } from 'react';
import type { GibsLayer } from '@/config/layers';
import { fetchAvailability, type Availability } from '@/services/gibs';

interface State {
  data: Availability | null;
  loading: boolean;
  error: string | null;
}

/** Mengambil (dan meng-cache) rentang tanggal tersedia layer GIBS. */
export function useGibsAvailability(layer: GibsLayer | null, enabled = true): State {
  const [state, setState] = useState<State>({ data: null, loading: false, error: null });

  useEffect(() => {
    if (!layer || !enabled) return;
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    fetchAvailability(layer)
      .then((data) => alive && setState({ data, loading: false, error: null }))
      .catch((e: Error) => alive && setState({ data: null, loading: false, error: e.message }));
    return () => {
      alive = false;
    };
  }, [layer, enabled]);

  return state;
}
