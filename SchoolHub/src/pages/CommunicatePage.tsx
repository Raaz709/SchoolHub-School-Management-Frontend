import { useCallback, useMemo, useState } from "react";
import {
  Bell,
  Check,
  Megaphone,
  Pencil,
  Plus,
  Save,
  Trash2,
  Users,
} from "lucide-react";
import { fetchClasses, type ClassItem } from "../api/academic";
import {
  TARGET_ROLES,
  createAnnouncement,
  deleteAnnouncement,
  fetchAnnouncements,
  formatAnnouncementDate,
  updateAnnouncement,
  type Announcement,
  type TargetRole,
} from "../api/announcements";
import {
  deleteNotification,
  fetchNotifications,
  formatNotificationDate,
  markAllNotificationsRead,
  markNotificationRead,
  type Notification,
} from "../api/notifications";
import { useAsync } from "../hooks/useAsync";
import { useAuth } from "../context/useAuth";
import { PageHeader } from "../components/layout/PageHeader";
import { ErrorState } from "../components/common/ErrorState";
import { Skeleton } from "../components/common/Skeleton";

/* ------------------------------ styling ------------------------------ */

const card = "rounded-2xl border border-line bg-white";
const label = "mb-1.5 block text-[12px] font-semibold text-ink-700";
const field =
  "w-full rounded-xl border border-line bg-white px-3 py-2.5 text-[13px] text-ink-900 focus:border-mint-300 focus:outline-none focus:ring-2 focus:ring-mint-100 disabled:bg-line-soft/40 disabled:text-ink-400";
const primaryBtn =
  "inline-flex items-center gap-1.5 rounded-xl bg-mint-600 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-mint-500 disabled:opacity-60";
const ghostBtn =
  "inline-flex items-center gap-1.5 rounded-xl border border-line px-3 py-1.5 text-[12px] font-semibold text-ink-700 transition-colors hover:bg-line-soft disabled:opacity-60";
const dangerBtn =
  "inline-flex items-center gap-1.5 rounded-xl border border-rose-200 px-3 py-1.5 text-[12px] font-semibold text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-60";

type Notice = { tone: "ok" | "err"; text: string } | null;

function NoticeBar({ notice }: { notice: Notice }) {
  if (!notice) return null;
  return (
    <div
      className={
        "mb-4 rounded-xl border px-4 py-2.5 text-[12.5px] font-medium " +
        (notice.tone === "ok"
          ? "border-mint-200 bg-mint-50 text-mint-600"
          : "border-rose-200 bg-rose-50 text-rose-600")
      }
    >
      {notice.text}
    </div>
  );
}

/** The five audiences the API accepts, each with its own colour. */
function targetTone(role: TargetRole): string {
  switch (role) {
    case "Student":
      return "bg-sky-50 text-sky-700 ring-sky-200";
    case "Parent":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "Teacher":
      return "bg-violet-50 text-violet-700 ring-violet-200";
    case "Admin":
      return "bg-rose-50 text-rose-700 ring-rose-200";
    default:
      return "bg-mint-50 text-mint-700 ring-mint-200";
  }
}

function TargetPill({ role }: { role: TargetRole }) {
  return (
    <span
      className={
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 " +
        targetTone(role)
      }
    >
      {role === "All" ? "Everyone" : role}
    </span>
  );
}

/**
 * One place for school-to-home communication: a scoped announcements feed staff
 * can publish to, and the signed-in user's own notification inbox. The API
 * decides who each notice reaches; the page only renders what it is given.
 */
export function CommunicatePage() {
  const { user } = useAuth();
  const isStaff = user?.role === "Admin" || user?.role === "Teacher";

  const [notice, setNotice] = useState<Notice>(null);
  /** `"new"` opens the compose form, a row opens it for editing, null closes. */
  const [editing, setEditing] = useState<Announcement | "new" | null>(null);

  const announcements = useAsync(
    useCallback((signal: AbortSignal) => fetchAnnouncements(signal), []),
  );
  // Only staff may read the class list; a learner resolves to an empty picker.
  const classes = useAsync(
    useCallback(
      (signal: AbortSignal) => (isStaff ? fetchClasses(signal) : Promise.resolve([] as ClassItem[])),
      [isStaff],
    ),
  );
  const notifications = useAsync(
    useCallback((signal: AbortSignal) => fetchNotifications(signal), []),
  );

  const rows = useMemo(() => announcements.data ?? [], [announcements.data]);
  const classOptions = useMemo(() => classes.data ?? [], [classes.data]);
  const inbox = useMemo(() => notifications.data ?? [], [notifications.data]);
  const unread = useMemo(() => inbox.filter((n) => !n.IsRead).length, [inbox]);

  return (
    <>
      <PageHeader
        title="Communicate"
        subtitle="School notices and your notifications in one place."
        action={
          isStaff ? (
            <button onClick={() => setEditing("new")} className={ghostBtn}>
              <Plus className="h-4 w-4" />
              New announcement
            </button>
          ) : undefined
        }
      />

      <NoticeBar notice={notice} />

      {isStaff && editing !== null && (
        <AnnouncementForm
          announcement={editing === "new" ? null : editing}
          classes={classOptions}
          onDone={(text) => {
            setNotice({ tone: "ok", text });
            setEditing(null);
            announcements.refetch();
          }}
          onCancel={() => setEditing(null)}
        />
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Announcements feed */}
        <div className="lg:col-span-2">
          <div className={`${card} overflow-hidden`}>
            <div className="flex items-center gap-2 border-b border-line px-5 py-3.5 text-[13px] font-semibold text-ink-900">
              <Megaphone className="h-4 w-4 text-ink-400" strokeWidth={1.9} />
              Announcements
              <span className="text-[12px] font-normal text-ink-500">
                {rows.length} notice{rows.length === 1 ? "" : "s"}
              </span>
            </div>

            {announcements.error ? (
              <div className="p-5">
                <ErrorState
                  message={announcements.error.message}
                  status={announcements.status}
                  onRetry={announcements.refetch}
                />
              </div>
            ) : announcements.loading ? (
              <div className="space-y-3 p-5">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : rows.length === 0 ? (
              <div className="grid place-items-center py-16 text-center">
                <Megaphone className="mb-3 h-6 w-6 text-ink-400" strokeWidth={1.7} />
                <p className="text-[13px] text-ink-500">No announcements for you right now.</p>
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {rows.map((announcement) => (
                  <AnnouncementRow
                    key={announcement.Id}
                    announcement={announcement}
                    isStaff={isStaff}
                    onNotice={setNotice}
                    onEdit={setEditing}
                    onDeleted={(id) => {
                      if (editing !== null && editing !== "new" && editing.Id === id) setEditing(null);
                      announcements.refetch();
                    }}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Notifications inbox */}
        <div>
          <div className={`${card} overflow-hidden`}>
            <div className="flex items-center gap-2 border-b border-line px-5 py-3.5 text-[13px] font-semibold text-ink-900">
              <Bell className="h-4 w-4 text-ink-400" strokeWidth={1.9} />
              Notifications
              {unread > 0 && (
                <span className="rounded-full bg-mint-100 px-2 py-0.5 text-[11px] font-semibold text-mint-700">
                  {unread} new
                </span>
              )}
              {unread > 0 && (
                <button
                  onClick={() => void markAll(notifications.refetch, setNotice)}
                  className="ml-auto text-[12px] font-medium text-mint-700 hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>

            {notifications.error ? (
              <div className="p-5">
                <ErrorState
                  message={notifications.error.message}
                  status={notifications.status}
                  onRetry={notifications.refetch}
                />
              </div>
            ) : notifications.loading ? (
              <div className="space-y-3 p-5">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : inbox.length === 0 ? (
              <div className="grid place-items-center py-14 text-center">
                <Bell className="mb-3 h-6 w-6 text-ink-400" strokeWidth={1.7} />
                <p className="text-[13px] text-ink-500">You are all caught up.</p>
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {inbox.map((item) => (
                  <NotificationRow
                    key={item.Id}
                    notification={item}
                    onNotice={setNotice}
                    onChanged={() => notifications.refetch()}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ------------------------------ compose ------------------------------ */

async function markAll(refetch: () => void, onNotice: (n: Notice) => void) {
  try {
    const result = await markAllNotificationsRead();
    onNotice({ tone: "ok", text: result.Message });
    refetch();
  } catch (err) {
    onNotice({ tone: "err", text: err instanceof Error ? err.message : String(err) });
  }
}

function AnnouncementForm({
  announcement,
  classes,
  onDone,
  onCancel,
}: {
  announcement: Announcement | null;
  classes: ClassItem[];
  onDone: (text: string) => void;
  onCancel: () => void;
}) {
  const isEdit = announcement != null;
  const [title, setTitle] = useState(announcement?.Title ?? "");
  const [content, setContent] = useState(announcement?.Content ?? "");
  const [targetRole, setTargetRole] = useState<TargetRole>(announcement?.TargetRole ?? "All");
  const [classId, setClassId] = useState<string>(
    announcement?.ClassId != null ? String(announcement.ClassId) : "",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    const payload = {
      Title: title.trim(),
      Content: content.trim(),
      TargetRole: targetRole,
      ClassId: classId === "" ? null : Number(classId),
    };
    try {
      const result =
        announcement == null
          ? await createAnnouncement(payload)
          : await updateAnnouncement(announcement.Id, payload);
      onDone(result.Message);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  const ready = title.trim().length > 0 && content.trim().length > 0 && !busy;

  return (
    <div className={`${card} mb-5 p-5`}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-4">
          <label className={label} htmlFor="an-title">Title</label>
          <input
            id="an-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="School closes early on Friday"
            className={field}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={label} htmlFor="an-target">Audience</label>
          <select
            id="an-target"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value as TargetRole)}
            className={field}
          >
            {TARGET_ROLES.map((role) => (
              <option key={role} value={role}>
                {role === "All" ? "Everyone" : role}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={label} htmlFor="an-class">Limit to a class (optional)</label>
          <select
            id="an-class"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className={field}
          >
            <option value="">All classes</option>
            {classes.map((c) => (
              <option key={c.Id} value={c.Id}>{c.Name}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2 lg:col-span-4">
          <label className={label} htmlFor="an-content">Message</label>
          <textarea
            id="an-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            placeholder="What everyone needs to know."
            className={field}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-1.5">
        <button onClick={onCancel} className={ghostBtn} disabled={busy}>Cancel</button>
        <button onClick={() => void submit()} className={primaryBtn} disabled={!ready}>
          <Save className="h-4 w-4" />
          {busy ? "Saving..." : isEdit ? "Save changes" : "Publish"}
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-[12.5px] font-medium text-rose-600">
          {error}
        </div>
      )}
    </div>
  );
}

/* ------------------------------ rows ------------------------------ */

function AnnouncementRow({
  announcement,
  isStaff,
  onNotice,
  onEdit,
  onDeleted,
}: {
  announcement: Announcement;
  isStaff: boolean;
  onNotice: (n: Notice) => void;
  onEdit: (announcement: Announcement) => void;
  onDeleted: (id: number) => void;
}) {
  async function remove() {
    try {
      const result = await deleteAnnouncement(announcement.Id);
      onNotice({ tone: "ok", text: result.Message });
      onDeleted(announcement.Id);
    } catch (err) {
      onNotice({ tone: "err", text: err instanceof Error ? err.message : String(err) });
    }
  }

  return (
    <li className="px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[14px] font-semibold text-ink-900">{announcement.Title}</span>
            <TargetPill role={announcement.TargetRole} />
            {announcement.ClassName && (
              <span className="inline-flex items-center gap-1 rounded-full bg-line-soft px-2.5 py-0.5 text-[11px] font-semibold text-ink-600 ring-1 ring-line">
                <Users className="h-3 w-3" strokeWidth={1.9} />
                {announcement.ClassName}
              </span>
            )}
          </div>
          <p className="mt-1.5 whitespace-pre-line text-[12.5px] text-ink-600">
            {announcement.Content}
          </p>
          <p className="mt-1.5 text-[11.5px] text-ink-400">
            {announcement.AuthorName ? `${announcement.AuthorName} · ` : ""}
            {formatAnnouncementDate(announcement.CreatedAt)}
          </p>
        </div>

        {isStaff && (
          <div className="flex items-center gap-2">
            <button onClick={() => onEdit(announcement)} className={ghostBtn}>
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>
            <button onClick={() => void remove()} className={dangerBtn}>
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        )}
      </div>
    </li>
  );
}

function NotificationRow({
  notification,
  onNotice,
  onChanged,
}: {
  notification: Notification;
  onNotice: (n: Notice) => void;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);

  async function markRead() {
    if (notification.IsRead) return;
    setBusy(true);
    try {
      await markNotificationRead(notification.Id);
      onChanged();
    } catch (err) {
      onNotice({ tone: "err", text: err instanceof Error ? err.message : String(err) });
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    try {
      const result = await deleteNotification(notification.Id);
      onNotice({ tone: "ok", text: result.Message });
      onChanged();
    } catch (err) {
      onNotice({ tone: "err", text: err instanceof Error ? err.message : String(err) });
    }
  }

  return (
    <li className={"px-5 py-3.5 " + (notification.IsRead ? "" : "bg-mint-50/40")}>
      <div className="flex items-start gap-3">
        <span
          className={
            "mt-1.5 h-2 w-2 shrink-0 rounded-full " +
            (notification.IsRead ? "bg-line" : "bg-mint-500")
          }
        />
        <div className="min-w-0 flex-1">
          <p className="text-[12.5px] font-semibold text-ink-900">{notification.Title}</p>
          <p className="mt-0.5 whitespace-pre-line text-[12px] text-ink-500">
            {notification.Message}
          </p>
          <p className="mt-1 text-[11px] text-ink-400">
            {formatNotificationDate(notification.CreatedAt)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {!notification.IsRead && (
            <button
              onClick={() => void markRead()}
              disabled={busy}
              aria-label="Mark as read"
              className="grid h-7 w-7 place-items-center rounded-lg border border-line text-ink-500 transition hover:bg-line-soft hover:text-mint-700 disabled:opacity-60"
            >
              <Check className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          )}
          <button
            onClick={() => void remove()}
            aria-label="Delete notification"
            className="grid h-7 w-7 place-items-center rounded-lg border border-line text-ink-400 transition hover:bg-rose-50 hover:text-rose-600"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.9} />
          </button>
        </div>
      </div>
    </li>
  );
}
