import { AlertTriangle, RefreshCw } from "lucide-react";

type ErrorStateProps = {
  message: string;
  status: number | null;
  onRetry: () => void;
};

export function ErrorState({ message, status, onRetry }: ErrorStateProps) {
  const hint =
    status === 401
      ? "You are not signed in. Set a token and retry."
      : status === 403
        ? "This dashboard is Admin-only."
        : status === null
          ? "Cannot reach the API. Is the backend running?"
          : message;

  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-line bg-white px-6 py-16 text-center">
      <AlertTriangle className="mb-3 h-6 w-6 text-amber-500" strokeWidth={1.9} />
      <p className="text-[13.5px] font-medium text-ink-700">Could not load dashboard</p>
      <p className="mt-1 max-w-md text-[12.5px] text-ink-500">{hint}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-mint-500 px-4 py-2 text-[12.5px] font-semibold text-white transition hover:bg-mint-600"
      >
        <RefreshCw className="h-3.5 w-3.5" strokeWidth={2.2} />
        Retry
      </button>
    </div>
  );
}[13.5px] font-medium text-ink-700">Could not load dashboard</p>
      <p className="mt-1 max-w-md text-[12.5px] text-ink-500">{hint}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-mint-500 px-4 py-2 text-[12.5px] font-semibold text-white transition hover:bg-mint-600"
      >
        <RefreshCw className="h-3.5 w-3.5" strokeWidth={2.2} />
        Retry
      </button>
    </div>
  );
}