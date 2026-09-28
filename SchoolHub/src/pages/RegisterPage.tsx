import { useState } from "react";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { register } from "../api/auth";
import { ApiError } from "../lib/api";
import { useAuth } from "../context/AuthContext";

type Role = "Student" | "Teacher" | "Parent";

export function RegisterPage({ onBack }: { onBack: () => void }) {
  const { signIn } = useAuth();
  const [role, setRole] = useState<Role>("Student");
  const [form, setForm] = useState({
    Username: "",
    Email: "",
    Password: "",
    RollNumber: "",
    EmployeeCode: "",
    Occupation: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await register({
        Username: form.Username,
        Email: form.Email,
        Password: form.Password,
        Role: role,
        ...(role === "Student" ? { RollNumber: form.RollNumber } : {}),
        ...(role === "Teacher" ? { EmployeeCode: form.EmployeeCode } : {}),
        ...(role === "Parent" ? { Occupation: form.Occupation } : {}),
      });
      signIn(res);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Cannot reach the API. Is the backend running?",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-canvas px-4 py-8">
      <div className="w-full max-w-[460px] rounded-3xl border border-line bg-white p-8 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.25)]">
        <button
          type="button"
          onClick={onBack}
          className="mb-5 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-ink-500 hover:text-ink-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
          Back to sign in
        </button>

        <div className="mb-6 flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-mint-100">
            <GraduationCap className="h-5 w-5 text-mint-600" strokeWidth={2.2} />
          </span>
          <div>
            <h1 className="text-[20px] font-bold tracking-tight text-ink-900">
              Create account
            </h1>
            <p className="text-[12px] text-ink-500">Join SchoolHub</p>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-3 gap-2 rounded-xl bg-line-soft p-1">
          {(["Student", "Teacher", "Parent"] as Role[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={
                "rounded-lg py-2 text-[12.5px] font-semibold transition " +
                (role === r
                  ? "bg-white text-ink-900 shadow-sm"
                  : "text-ink-500 hover:text-ink-700")
              }
            >
              {r}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="space-y-3.5">
          <Field label="Username" value={form.Username} onChange={(v) => set("Username", v)} />
          <Field label="Email" type="email" value={form.Email} onChange={(v) => set("Email", v)} />
          <Field label="Password" type="password" value={form.Password} onChange={(v) => set("Password", v)} />

          {role === "Student" && (
            <Field label="Roll Number" value={form.RollNumber} onChange={(v) => set("RollNumber", v)} />
          )}
          {role === "Teacher" && (
            <Field label="Employee Code" value={form.EmployeeCode} onChange={(v) => set("EmployeeCode", v)} />
          )}
          {role === "Parent" && (
            <Field label="Occupation" value={form.Occupation} onChange={(v) => set("Occupation", v)} />
          )}

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
            {busy ? "Creating..." : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-center text-[12.5px] text-ink-500">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onBack}
            className="font-semibold text-mint-600 hover:underline"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12.5px] font-semibold text-ink-700">
        {label}
      </span>
      <input
        type={type}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-[13px] text-ink-900 placeholder:text-ink-400 focus:border-mint-300 focus:outline-none focus:ring-2 focus:ring-mint-100"
      />
    </label>
  );
}