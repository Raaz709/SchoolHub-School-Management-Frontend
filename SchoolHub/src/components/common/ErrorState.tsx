import { AlertTriangle, RefreshCw, LogIn } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

type ErrorStateProps = {
  message: string;
  status: number | null;
  onRetry: () => void;
};

export function ErrorState({ message, status, onRetry }: ErrorStateProps) {
  const { signOut } = useAuth();

  const hint =
    status === 401
      ? "Your session has expired or you are not signed in."
      : status === 403
        ? "This page requires higher privileges."
        : status === null
          ? "Cannot reach the API. Is the backend running?"
          : message;

  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-line bg-white px-6 py-16 text-center">
      <AlertTriangle className="mb-3 h-6 w-6 text-amber-500" strokeWidth={1.9} />
      <p className="text-[13.5px] font-medium text-ink-700">Could not load page data</p>
      <p className="mt-1 max-w-md text-[12.5px] text-ink-500">{hint}</p>
      <div className="mt-5 flex items-center gap-3">
        {status === 401 ? (
          <button
            type="button"
            onClick={signOut}
            className="inline-flex items-center gap-2 rounded-xl bg-mint-500 px-4 py-2 text-[12.5px] font-semibold text-white transition hover:bg-mint-600"
          >
            <LogIn className="h-3.5 w-3.5" strokeWidth={2.2} />
            Sign in again
          </button>
        ) : (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-xl bg-mint-500 px-4 py-2 text-[12.5px] font-semibold text-white transition hover:bg-mint-600"
          >
            <RefreshCw className="h-3.5 w-3.5" strokeWidth={2.2} />
            Retry
          </button>
        )}
      </div>
    </div>
  );
}