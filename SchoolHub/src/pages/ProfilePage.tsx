import { useState } from "react";
import { UserRound, Mail, Shield, Calendar, CheckCircle2 } from "lucide-react";
import { fetchProfile, updateProfile } from "../api/profile";
import { useAsync } from "../hooks/useAsync";
import { PageHeader } from "../components/layout/PageHeader";
import { ErrorState } from "../components/common/ErrorState";
import { Skeleton } from "../components/common/Skeleton";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/api";

export function ProfilePage() {
  const { user } = useAuth();
  const profile = useAsync(fetchProfile);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const data = profile.data;
  if (data && !username && !editing) {
    setUsername(data.Username);
    setEmail(data.Email);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      await updateProfile({ Username: username, Email: email });
      setSuccessMsg("Profile updated successfully.");
      setEditing(false);
      profile.refetch();
    } catch (err) {
      setErrorMsg(
        err instanceof ApiError ? err.message : "Failed to update profile.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (profile.error) {
    return (
      <>
        <PageHeader
          title="My Profile"
          subtitle="Manage your personal account details."
        />
        <ErrorState
          message={profile.error.message}
          status={profile.status}
          onRetry={profile.refetch}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="My Profile"
        subtitle="Manage your personal account details."
      />

      <div className="max-w-2xl rounded-3xl border border-line bg-white p-8 shadow-xs">
        {profile.loading || !data ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            <div className="flex items-center gap-4 border-b border-line pb-6">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-mint-100 text-2xl font-bold text-mint-600">
                {username ? username.slice(0, 2).toUpperCase() : "US"}
              </div>
              <div>
                <h2 className="text-lg font-bold text-ink-900">{data.Username}</h2>
                <p className="text-[12.5px] text-ink-500 capitalize">
                  Role: {user?.role ?? "User"}
                </p>
              </div>
            </div>

            {successMsg && (
              <div className="flex items-center gap-2 rounded-xl bg-mint-50 px-4 py-3 text-[13px] font-medium text-mint-600">
                <CheckCircle2 className="h-4 w-4" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <p className="rounded-xl bg-rose-50 px-4 py-3 text-[13px] text-rose-600">
                {errorMsg}
              </p>
            )}

            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-[12.5px] font-semibold text-ink-700">
                  Username
                </span>
                <div className="relative">
                  <UserRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                  <input
                    type="text"
                    disabled={!editing}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-xl border border-line bg-white py-2.5 pl-10 pr-3 text-[13px] text-ink-900 disabled:bg-line-soft/50 focus:border-mint-300 focus:outline-none focus:ring-2 focus:ring-mint-100"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[12.5px] font-semibold text-ink-700">
                  Email Address
                </span>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                  <input
                    type="email"
                    disabled={!editing}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-line bg-white py-2.5 pl-10 pr-3 text-[13px] text-ink-900 disabled:bg-line-soft/50 focus:border-mint-300 focus:outline-none focus:ring-2 focus:ring-mint-100"
                  />
                </div>
              </label>

              <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-xl border border-line bg-line-soft/30 p-3.5">
                  <Shield className="h-4 w-4 text-ink-500" />
                  <div>
                    <span className="block text-[11px] text-ink-500">
                      Account Status
                    </span>
                    <span className="text-[12.5px] font-semibold text-ink-900">
                      {data.IsActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-line bg-line-soft/30 p-3.5">
                  <Calendar className="h-4 w-4 text-ink-500" />
                  <div>
                    <span className="block text-[11px] text-ink-500">
                      Member Since
                    </span>
                    <span className="text-[12.5px] font-semibold text-ink-900">
                      {new Date(data.CreatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-line pt-4">
              {!editing ? (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="rounded-xl bg-mint-500 px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-mint-600"
                >
                  Edit Profile
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setUsername(data.Username);
                      setEmail(data.Email);
                    }}
                    className="rounded-xl border border-line bg-white px-5 py-2.5 text-[13px] font-semibold text-ink-700 transition hover:bg-line-soft"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-mint-500 px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-mint-600 disabled:opacity-60"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </>
              )}
            </div>
          </form>
        )}
      </div>
    </>
  );
}
