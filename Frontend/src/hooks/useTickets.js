import { useState, useEffect, useCallback } from "react";
import { ticketsAPI, getErrorMessage } from "../api";

export function useMyTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { tickets } = await ticketsAPI.getMyTickets();
      setTickets(tickets);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load tickets"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(fetch);
  }, [fetch]);

  return { tickets, loading, error, refetch: fetch };
}

export function useTicketStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    ticketsAPI
      .getStats()
      .then(setStats)
      .catch((err) => setError(getErrorMessage(err, "Failed to load stats")))
      .finally(() => setLoading(false));
  }, []);

  return { stats, loading, error };
}
