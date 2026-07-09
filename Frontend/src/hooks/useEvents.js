import { useState, useEffect, useCallback } from "react";
import { eventsAPI, getErrorMessage } from "../api";

export function useEvents(params) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { events } = await eventsAPI.getAll(params);
      setEvents(events);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load events"));
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    Promise.resolve().then(fetch);
  }, [fetch]);

  return { events, loading, error, refetch: fetch };
}

export function useFeaturedEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    eventsAPI
      .getFeatured()
      .then(setEvents)
      .catch((err) =>
        setError(getErrorMessage(err, "Failed to load featured events")),
      )
      .finally(() => setLoading(false));
  }, []);

  return { events, loading, error };
}

export function useEventSearch(query, category) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.resolve().then(() => {
      if (!query && !category) {
        setResults([]);
        return;
      }
      setLoading(true);
      setError(null);
      eventsAPI
        .search({ q: query, category })
        .then(({ events }) => setResults(events))
        .catch((err) => setError(getErrorMessage(err, "Search failed")))
        .finally(() => setLoading(false));
    });
  }, [query, category]);

  return { results, loading, error };
}
