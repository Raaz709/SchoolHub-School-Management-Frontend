import { GraduationCap, UserRound } from "lucide-react";
import { fetchParentChildren } from "../api/portals";
import { useAsync } from "../hooks/useAsync";
import { PageHeader } from "../components/layout/PageHeader";
import { ErrorState } from "../components/common/ErrorState";
import { Skeleton } from "../components/common/Skeleton";
import { useAuth } from "../context/useAuth";

export function ParentDashboard() {
  const { user } = useAuth();
  const children = useAsync(fetchParentChildren);

  if (children.error) {
    return (
      <>
        <PageHeader title="My Children" subtitle="Your family's school overview." />
        <ErrorState
          message={children.error.message}
          status={children.status}
          onRetry={children.refetch}
        />
      </>
    );
  }

  const kids = children.data ?? [];

  return (
    <>
      <PageHeader
        title={`Welcome, ${user?.username ?? "Parent"}`}
        subtitle={`${kids.length} child${kids.length === 1 ? "" : "ren"} linked to your account`}
      />

      {children.loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[140px]" />
          ))}
        </div>
      ) : kids.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-line bg-white px-6 py-16 text-center">
          <UserRound className="mb-3 h-6 w-6 text-ink-400" strokeWidth={1.7} />
          <p className="text-[13px] text-ink-500">
            No children linked to your account yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {kids.map((c) => (
            <div
              key={c.StudentId}
              className="rounded-2xl border border-line bg-white p-5"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-mint-50">
                <GraduationCap className="h-5 w-5 text-mint-600" strokeWidth={1.9} />
              </span>
              <p className="mt-3.5 text-[15px] font-bold text-ink-900">
                {c.StudentName}
              </p>
              <p className="mt-0.5 text-[12.5px] text-ink-500">
                Roll No {c.RollNumber}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="rounded-full bg-line-soft px-2.5 py-0.5 text-[11px] font-medium text-ink-700">
                  {c.ClassName ?? "No class"}
                </span>
                {c.SectionName && (
                  <span className="rounded-full bg-line-soft px-2.5 py-0.5 text-[11px] font-medium text-ink-700">
                    Section {c.SectionName}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}