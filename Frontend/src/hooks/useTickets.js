import { useState, useEffect, useCallback } from 'react';
import { ticketsAPI } from '../api';

export function useMyTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await ticketsAPI.getMyTickets();
      setTickets(data.data?.tickets || data.tickets || data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { tickets, loading, error, refetch: fetch };
}

export function useTicketStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    ticketsAPI.getStats()
      .then(({ data }) => setStats(data.data?.stats || data.data || null))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

  return { stats, loading, error };
}
