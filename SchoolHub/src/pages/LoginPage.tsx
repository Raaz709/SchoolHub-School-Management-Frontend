import { useState } from "react";
import { GraduationCap, Lock, Mail } from "lucide-react";
import { login } from "../api/auth";
import { ApiError } from "../lib/api";
import { useAuth } from "../context/useAuth";
import { RegisterPage } from "./RegisterPage";

export function LoginPage() {
  const { signIn } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (mode === "register") {
    return <RegisterPage onBack={() => setMode("login")} />;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await login({ Username: username, Password: password });
      signIn(res);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.status === 401
            ? "Invalid username or password."
            : err.message
          : "Cannot reach the API. Is the backend running?",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-canvas px-4">
      <div className="w-full max-w-[420px] rounded-3xl border border-line bg-white p-8 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.25)]">
        <div className="mb-7 flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-mint-100">
            <GraduationCap className="h-5 w-5 text-mint-600" strokeWidth={2.2} />
          </span>
          <div>
            <h1 className="text-[20px] font-bold tracking-tight text-ink-900">
              SchoolHub
            </h1>
            <p className="text-[12px] text-ink-500">Sign in to continue</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-semibold text-ink-700">
              Username
            </span>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
                strokeWidth={1.9}
              />
              <input
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full rounded-xl border border-line bg-white py-2.5 pl-10 pr-3 text-[13px] text-ink-900 placeholder:text-ink-400 focus:border-mint-300 focus:outline-none focus:ring-2 focus:ring-mint-100"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-semibold text-ink-700">
              Password
            </span>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
                strokeWidth={1.9}
              />
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-xl border border-line bg-white py-2.5 pl-10 pr-3 text-[13px] text-ink-900 placeholder:text-ink-400 focus:border-mint-300 focus:outline-none focus:ring-2 focus:ring-mint-100"
              />
            </div>
          </label>

          {error && (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-[12px] text-rose-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-mint-500 py-2.5 text-[13px] font-semibold text-white transition hover:bg-mint-600 disabled:opacity-60"
          >
            {busy ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-5 text-center text-[12.5px] text-ink-500">
          No account?{" "}
          <button
            type="button"
            onClick={() => setMode("register")}
            className="font-semibold text-mint-600 hover:underline"
          >
            Create one
          </button>
        </p>
      </div>
    </div>
  );
}