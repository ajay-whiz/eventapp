import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../../../axios';
import type { DashboardStats } from '../types/dashboard';

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export function useDashboard() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  const fetchDashboard = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError(null);

    try {
      const response = await api.get('admin/dashboard/stats');
      const payload = response.data?.data ?? response.data;
      if (isMounted.current) {
        setData(payload);
      }
    } catch (err: any) {
      if (isMounted.current) {
        setError(
          err.response?.data?.message || err.message || 'Failed to load dashboard data',
        );
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    fetchDashboard();

    const interval = setInterval(() => fetchDashboard(false), REFRESH_INTERVAL_MS);
    return () => {
      isMounted.current = false;
      clearInterval(interval);
    };
  }, [fetchDashboard]);

  return { data, loading, error, refresh: () => fetchDashboard() };
}
