import { useCallback, useEffect, useState } from "react";
import { ApiError } from "../lib/api";

type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: Error | null;
  status: number | null;
};

/**
 * Minimal async-resource hook — the feature-2 stand-in for TanStack Query.
 * Pass a module-level (stable) function so `run` keeps a stable identity.
 */
export function useAsync<T>(run: (signal: AbortSignal) => Promise<T>) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: true,
    error: null,
    status: null,
  });

  const load = useCallback(() => {
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null, status: null }));

    run(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setState({ data, loading: false, error: null, status: null });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        const error = err instanceof Error ? err : new Error(String(err));
        setState({
          data: null,
          loading: false,
          error,
          status: err instanceof ApiError ? err.status : null,
        });
      });

    return () => controller.abort();
  }, [run]);

  useEffect(() => load(), [load]);

  return { ...state, refetch: load };
}