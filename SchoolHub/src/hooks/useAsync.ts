import { useId } from "react";
import { useQuery } from "@tanstack/react-query";
import { ApiError } from "../lib/api";

/**
 * Thin wrapper around TanStack Query's useQuery that preserves the
 * original `useAsync` API so all existing pages keep working without changes.
 */
export function useAsync<T>(run: (signal: AbortSignal) => Promise<T>) {
  // Generate a stable key per call-site using React's useId (stable across renders).
  const id = useId();

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["useAsync", id],
    queryFn: ({ signal }) => run(signal),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return {
    data: data ?? null,
    loading: isPending,
    error: isError ? (error instanceof Error ? error : new Error(String(error))) : null,
    status: isError && error instanceof ApiError ? error.status : null,
    refetch,
  };
}