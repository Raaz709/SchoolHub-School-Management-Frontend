import { BookOpen, Calendar, Bell, ClipboardCheck } from "lucide-react";
import { fetchStudentDashboard } from "../api/portals";
import { fetchAnnouncements } from "../api/announcements";
import { useAsync } from "../hooks/useAsync";
import { PageHeader } from "../components/layout/PageHeader";
import { StatCard } from "../components/dashboard/StatCard";
import { AnnouncementsPanel } from "../components/dashboard/AnnouncementsPanel";
import { ErrorState } from "../components/common/ErrorState";
import { Skeleton } from "../components/common/Skeleton";
import { useAuth } from "../context/useAuth";

export function StudentDashboard() {
  const { user } = useAuth();
  const stats = useAsync(fetchStudentDashboard);
  const news = useAsync(fetchAnnouncements);

  if (stats.error) {
    return (
      <>
        <PageHeader title="My Dashboard" subtitle="Your school at a glance." />
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
        title={`Welcome, ${user?.username ?? "Student"}`}
        subtitle="Your school at a glance."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.loading || !d ? (
          [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[132px]" />)
        ) : (
          <>
            <StatCard
              label="Attendance"
              value={`${Math.round(d.AttendancePercentage)}%`}
              icon={ClipboardCheck}
              tone="green"
              hint="Overall attendance"
            />
            <StatCard
              label="Pending Assignments"
              value={d.PendingAssignments}
              icon={BookOpen}
              tone="amber"
            />
            <StatCard
              label="Upcoming Exam"
              value={d.UpcomingExam}
              icon={Calendar}
              tone="blue"
            />
            <StatCard
              label="Unread Notifications"
              value={d.UnreadNotifications}
              icon={Bell}
              tone="violet"
            />
          </>
        )}
      </div>

      <div className="mt-6">
        <AnnouncementsPanel items={news.data ?? []} loading={news.loading} />
      </div>
    </>
  );
}