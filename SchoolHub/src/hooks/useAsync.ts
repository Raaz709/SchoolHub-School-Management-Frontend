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
 * Pass a module-level (stable) function so the fetch keeps a stable identity.
 */
export function useAsync<T>(run: (signal: AbortSignal) => Promise<T>) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: true,
    error: null,
    status: null,
  });

  /**
   * Success/failure handling, shared by the initial load and by refetch.
   *
   * This is a callback rather than inline effect code so the effect body can
   * stay free of synchronous `setState` calls. React treats those as a
   * cascading render: the effect commits, the component renders again, and the
   * screen can visibly stutter on every mount.
   */
  const settle = useCallback((signal: AbortSignal, promise: Promise<T>) => {
    promise
      .then((data) => {
        if (signal.aborted) return;
        setState({ data, loading: false, error: null, status: null });
      })
      .catch((err: unknown) => {
        if (signal.aborted) return;
        const error = err instanceof Error ? err : new Error(String(err));
        setState({
          data: null,
          loading: false,
          error,
          status: err instanceof ApiError ? err.status : null,
        });
      });
  }, []);

  const refetch = useCallback(() => {
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null, status: null }));
    settle(controller.signal, run(controller.signal));
    return () => controller.abort();
  }, [run, settle]);

  useEffect(() => {
    // `loading` is already true from the initial state, so this body
    // deliberately sets no state: it only starts the request and arranges for
    // it to be aborted if the component unmounts or `run` changes.
    const controller = new AbortController();
    settle(controller.signal, run(controller.signal));
    return () => controller.abort();
  }, [run, settle]);

  return { ...state, refetch };
}
