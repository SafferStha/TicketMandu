import { useState, useEffect, useCallback } from 'react';
import { eventsAPI } from '../api';

export function useEvents(params) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await eventsAPI.getAll(params);
      setEvents(data.data?.events || data.events || data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  // params changes intentionally not in dep array — caller controls when to re-fetch
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { events, loading, error, refetch: fetch };
}

export function useFeaturedEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    eventsAPI.getFeatured()
      .then(({ data }) => setEvents(data.data?.events || data.events || data.data || []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load featured events'))
      .finally(() => setLoading(false));
  }, []);

  return { events, loading, error };
}

export function useEventSearch(query, category) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!query && !category) {
      setResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    eventsAPI.search(query, category)
      .then(({ data }) => setResults(data.data?.events || data.events || data.data || []))
      .catch((err) => setError(err.response?.data?.message || 'Search failed'))
      .finally(() => setLoading(false));
  }, [query, category]);

  return { results, loading, error };
}
