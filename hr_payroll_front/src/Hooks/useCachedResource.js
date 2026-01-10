import { useState, useCallback, useEffect } from "react";

export default function useCachedResource({
  fetcher,
  transform,
  cacheTime = 5 * 60 * 1000,
  ...options
}) {
  const [state, setState] = useState({
    data: null,
    loading: false,
    error: null,
    timestamp: null,
  });

  const fetchData = useCallback(
    async (forceRefresh = false) => {
      const now = Date.now();

      if (
        !forceRefresh &&
        state.data &&
        state.timestamp &&
        now - state.timestamp < cacheTime
      ) {
        return state.data;
      }

      if (state.loading) {
        return state.data;
      }

      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
      }));

      try {
        const response = await fetcher();
        const transformed = transform(response);

        setState({
          data: transformed,
          loading: false,
          error: null,
          timestamp: now,
        });

        return transformed;
      } catch (err) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err.message || "Failed to load data",
        }));

        return null;
      }
    },
    [fetcher, transform, cacheTime, state]
  );
  
  // Initial fetch on mount
  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Auto-refresh logic
  useEffect(() => {
      if (options.autoRefresh && state.data) {
          const interval = setInterval(() => {
              fetchData(true);
          }, options.refreshInterval || cacheTime);
          return () => clearInterval(interval);
      }
  }, [options.autoRefresh, options.refreshInterval, cacheTime, state.data, fetchData]);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    get: () => fetchData(false),
    refresh: () => fetchData(true),
  };
}
