import { BookOpen, Users } from "lucide-react";
import { fetchTeacherClasses, fetchTeacherSubjects } from "../api/teacher";
import { useAsync } from "../hooks/useAsync";
import { PageHeader } from "../components/layout/PageHeader";
import { StatCard } from "../components/dashboard/StatCard";
import { ErrorState } from "../components/common/ErrorState";
import { Skeleton } from "../components/common/Skeleton";
import { useAuth } from "../context/AuthContext";

export function TeacherDashboard() {
  const { user } = useAuth();
  const classes = useAsync(fetchTeacherClasses);
  const subjects = useAsync(fetchTeacherSubjects);

  if (classes.error || subjects.error) {
    const err = classes.error ?? subjects.error;
    return (
      <>
        <PageHeader title="My Dashboard" subtitle="Your teaching overview." />
        <ErrorState
          message={err!.message}
          status={classes.status ?? subjects.status}
          onRetry={classes.refetch}
        />
      </>
    );
  }

  const classCount = classes.data?.length ?? 0;
  const subjectCount = subjects.data?.length ?? 0;

  return (
    <>
      <PageHeader
        title={`Welcome, ${user?.username ?? "Teacher"}`}
        subtitle="Your teaching overview."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {classes.loading ? (
          [0, 1].map((i) => <Skeleton key={i} className="h-[132px]" />)
        ) : (
          <>
            <StatCard label="My Classes" value={classCount} icon={Users} tone="blue" />
            <StatCard label="My Subjects" value={subjectCount} icon={BookOpen} tone="green" />
          </>
        )}
      </div>

      {!classes.loading && classCount > 0 && (
        <div className="mt-6 rounded-2xl border border-line bg-white p-5">
          <h2 className="mb-3 text-[14px] font-semibold text-ink-900">My Classes</h2>
          <ul className="divide-y divide-line">
            {(classes.data ?? []).map((c) => (
              <li key={c.Id} className="flex items-center justify-between py-2.5 text-[13px]">
                <span className="font-medium text-ink-900">{c.Name}</span>
                <span className="text-ink-500">Section {c.SectionName}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}