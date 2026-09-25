import {
  Bell,
  BookOpenCheck,
  Building2,
  GraduationCap,
  ScrollText,
  UserRound,
  Users,
} from "lucide-react";
import { fetchDashboardStats } from "../api/dashboard";
import { fetchAnnouncements } from "../api/announcements";
import { useAsync } from "../hooks/useAsync";
import { PageHeader } from "../components/layout/PageHeader";
import { StatCard } from "../components/dashboard/StatCard";
import { ActivityPanel } from "../components/dashboard/ActivityPanel";
import { AnnouncementsPanel } from "../components/dashboard/AnnouncementsPanel";
import { ErrorState } from "../components/common/ErrorState";
import { Skeleton } from "../components/common/Skeleton";

export function SchoolOverview() {
  const stats = useAsync(fetchDashboardStats);
  const news = useAsync(fetchAnnouncements);

  if (stats.error) {
    return (
      <>
        <PageHeader title="School Overview" subtitle="Live data from the SchoolHub API." />
        <ErrorState
          message={stats.error.message}
          status={stats.status}
          onRetry={stats.refetch}
        />
      </>
    );
  }

  const d = stats.data;

  return (
    <>
      <PageHeader
        title="School Overview"
        subtitle="Live data from the SchoolHub API."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.loading || !d ? (
          [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[132px]" />)
        ) : (
          <>
            <StatCard label="Total Students" value={d.TotalStudents} icon={GraduationCap} tone="green" />
            <StatCard label="Total Teachers" value={d.TotalTeachers} icon={Users} tone="blue" />
            <StatCard label="Total Parents"  value={d.TotalParents}  icon={UserRound} tone="violet" />
            <StatCard label="Total Classes"  value={d.TotalClasses}  icon={Building2} tone="sky" />
          </>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.loading || !d ? (
          [0, 1, 2].map((i) => <Skeleton key={i} className="h-[132px]" />)
        ) : (
          <>
            <StatCard
              label="Present Today"
              value={d.TodaysAttendance}
              icon={BookOpenCheck}
              tone="green"
              hint="Attendance marked today"
            />
            <StatCard
              label="Upcoming Exams"
              value={d.UpcomingExams}
              icon={ScrollText}
              tone="amber"
            />
            <StatCard
              label="Announcements"
              value={d.RecentAnnouncementsCount}
              icon={Bell}
              tone="rose"
            />
          </>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ActivityPanel items={d?.RecentActivity ?? []} loading={stats.loading} />
        <AnnouncementsPanel items={news.data ?? []} loading={news.loading} />
      </div>
    </>
  );
}