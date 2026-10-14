import { useCallback, useEffect, useState } from 'react';

import { api } from '../api.js';

// Loads the hourly slots (and daily capacity) for one date
export default function useSlots(date) {
  const [data, setData] = useState({ slots: [], capacity: { booked: 0, total: 0, percent: 0 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      setData(await api.get(`/slots?date=${date}`));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { ...data, setData, loading, error, reload };
}
