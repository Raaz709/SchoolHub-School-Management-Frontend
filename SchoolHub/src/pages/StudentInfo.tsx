import { useCallback, useMemo, useState } from "react";
import { Search, UserRound } from "lucide-react";
import { fetchStudents, searchStudents, type Student } from "../api/students";
import { fetchClasses, fetchSections } from "../api/academic";
import { useAsync } from "../hooks/useAsync";
import { PageHeader } from "../components/layout/PageHeader";
import { ErrorState } from "../components/common/ErrorState";
import { Skeleton } from "../components/common/Skeleton";

export function StudentInfo() {
  const [query, setQuery] = useState("");
  const [classId, setClassId] = useState<number | null>(null);
  const [sectionId, setSectionId] = useState<number | null>(null);

  const classes = useAsync(fetchClasses);
  const sections = useAsync(fetchSections);

  const runSearch = useCallback(
    (signal: AbortSignal) => {
      if (!query && !classId && !sectionId) return fetchStudents(signal);
      return searchStudents({ query, classId, sectionId }, signal);
    },
    [query, classId, sectionId],
  );

  const students = useAsync(runSearch);

  const rows = students.data ?? [];
  const sectionsForClass = useMemo(() => {
    if (!classId || !sections.data) return sections.data ?? [];
    const cls = classes.data?.find((c) => c.Id === classId);
    return cls ? sections.data.filter((s) => s.ClassName === cls.Name) : sections.data;
  }, [classId, sections.data, classes.data]);

  if (students.error) {
    return (
      <>
        <PageHeader title="Student Info" subtitle="Live data from the SchoolHub API." />
        <ErrorState
          message={students.error.message}
          status={students.status}
          onRetry={students.refetch}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Student Info"
        subtitle={`${rows.length} student${rows.length === 1 ? "" : "s"}`}
      />

      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-[1fr_200px_200px]">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
            strokeWidth={1.9}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, or roll number..."
            className="w-full rounded-xl border border-line bg-white py-2.5 pl-10 pr-3 text-[13px] text-ink-900 placeholder:text-ink-400 focus:border-mint-300 focus:outline-none focus:ring-2 focus:ring-mint-100"
          />
        </div>

        <select
          value={classId ?? ""}
          onChange={(e) => {
            setClassId(e.target.value ? Number(e.target.value) : null);
            setSectionId(null);
          }}
          className="rounded-xl border border-line bg-white px-3 py-2.5 text-[13px] text-ink-900 focus:border-mint-300 focus:outline-none focus:ring-2 focus:ring-mint-100"
        >
          <option value="">All classes</option>
          {(classes.data ?? []).map((c) => (
            <option key={c.Id} value={c.Id}>{c.Name}</option>
          ))}
        </select>

        <select
          value={sectionId ?? ""}
          onChange={(e) => setSectionId(e.target.value ? Number(e.target.value) : null)}
          disabled={!classId}
          className="rounded-xl border border-line bg-white px-3 py-2.5 text-[13px] text-ink-900 disabled:opacity-50 focus:border-mint-300 focus:outline-none focus:ring-2 focus:ring-mint-100"
        >
          <option value="">All sections</option>
          {sectionsForClass.map((s) => (
            <option key={s.Id} value={s.Id}>{s.Name}</option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        <div className="grid grid-cols-[100px_1fr_1fr_140px_140px_100px] gap-4 border-b border-line bg-line-soft/40 px-5 py-3 text-[11.5px] font-semibold uppercase tracking-wide text-ink-500">
          <span>Roll No</span>
          <span>Name</span>
          <span>Email</span>
          <span>Class</span>
          <span>Section</span>
          <span>Status</span>
        </div>

        {students.loading ? (
          <div className="space-y-3 p-5">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="grid place-items-center py-16 text-center">
            <UserRound className="mb-3 h-6 w-6 text-ink-400" strokeWidth={1.7} />
            <p className="text-[13px] text-ink-500">No students match your filters.</p>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((s: Student) => (
              <li
                key={s.Id}
                className="grid grid-cols-[100px_1fr_1fr_140px_140px_100px] items-center gap-4 px-5 py-3 text-[13px] text-ink-700 hover:bg-line-soft/40"
              >
                <span className="font-mono text-[12.5px] text-ink-500">{s.RollNumber}</span>
                <span className="truncate font-medium text-ink-900">{s.Username}</span>
                <span className="truncate text-ink-500">{s.Email}</span>
                <span>{s.ClassName ?? "—"}</span>
                <span>{s.SectionName ?? "—"}</span>
                <span>
                  <span
                    className={
                      "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold " +
                      (s.IsActive
                        ? "bg-mint-50 text-mint-600"
                        : "bg-rose-50 text-rose-600")
                    }
                  >
                    {s.IsActive ? "Active" : "Inactive"}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}