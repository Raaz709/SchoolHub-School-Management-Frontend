import { useCallback, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  MapPin,
  PartyPopper,
  Pencil,
  Plus,
  Save,
  Trash2,
  Users,
} from "lucide-react";
import {
  EVENT_STATUSES,
  createEvent,
  deleteEvent,
  fetchEventParticipants,
  fetchEvents,
  formatEventDate,
  removeParticipant,
  setRsvp,
  toIsoInstant,
  toLocalInput,
  updateEvent,
  type EventItem,
  type EventParticipant,
  type EventStatus,
} from "../api/events";
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
  "inline-flex items-center gap-1.5 rounded-xl border border-line px-4 py-2 text-[13px] font-semibold text-ink-700 transition-colors hover:bg-line-soft disabled:opacity-60";
const dangerBtn =
  "inline-flex items-center gap-1.5 rounded-xl border border-rose-200 px-3 py-1.5 text-[12px] font-semibold text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-60";

type Notice = { tone: "ok" | "err"; text: string } | null;

/** The API constrains a response to these four, so the tone is total. */
function statusTone(status: EventStatus): string {
  switch (status) {
    case "Attending":
      return "bg-mint-50 text-mint-700 ring-mint-200";
    case "Not Attending":
      return "bg-rose-50 text-rose-700 ring-rose-200";
    case "Maybe":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    default:
      return "bg-line-soft text-ink-600 ring-line";
  }
}

function StatusPill({ status }: { status: EventStatus }) {
  return (
    <span
      className={
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 " +
        statusTone(status)
      }
    >
      {status}
    </span>
  );
}

/**
 * Events are readable by every role; the sidebar shows the page to all four.
 * Staff create and cancel them, and everyone records their own response. The
 * API enforces the write rules independently of what is rendered here.
 */
export function EventsPage() {
  const { user } = useAuth();
  const role = user?.role ?? "";
  const isAdmin = role === "Admin";
  const isStaff = isAdmin || role === "Teacher";

  const [notice, setNotice] = useState<Notice>(null);
  /** `"new"` opens the create form, an event opens it on that row, null closes. */
  const [editing, setEditing] = useState<EventItem | "new" | null>(null);

  const events = useAsync(useCallback((signal: AbortSignal) => fetchEvents(signal), []));
  const rows = useMemo(() => events.data ?? [], [events.data]);

  return (
    <>
      <PageHeader
        title="Events"
        subtitle="School dates, trips and assemblies. Let the organiser know if you are coming."
        action={
          isAdmin ? (
            <button onClick={() => setEditing("new")} className={ghostBtn}>
              <Plus className="h-4 w-4" />
              New event
            </button>
          ) : undefined
        }
      />

      {notice && (
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
      )}

      {isAdmin && editing !== null && (
        <EventForm
          event={editing === "new" ? null : editing}
          onDone={(text) => {
            setNotice({ tone: "ok", text });
            setEditing(null);
            events.refetch();
          }}
          onCancel={() => setEditing(null)}
        />
      )}

      <EventList
        rows={rows}
        loading={events.loading}
        error={events.error && { message: events.error.message, status: events.status }}
        onRetry={events.refetch}
        isAdmin={isAdmin}
        isStaff={isStaff}
        currentUserId={user?.userId ?? 0}
        onNotice={setNotice}
        onChanged={() => events.refetch()}
        onEdit={(event) => setEditing(event)}
        onDeleted={(id) => {
          if (editing !== null && editing !== "new" && editing.Id === id) setEditing(null);
          events.refetch();
        }}
      />
    </>
  );
}

/* ------------------------------ create / edit ------------------------------ */

/** Create and edit share one form; mounted only while open, so no sync effect. */
function EventForm({
  event,
  onDone,
  onCancel,
}: {
  event: EventItem | null;
  onDone: (text: string) => void;
  onCancel: () => void;
}) {
  const isEdit = event != null;
  const [title, setTitle] = useState(event?.Title ?? "");
  const [description, setDescription] = useState(event?.Description ?? "");
  const [location, setLocation] = useState(event?.Location ?? "");
  const [when, setWhen] = useState(toLocalInput(event?.EventDate));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    // An empty optional field is sent as null rather than "", so the date is
    // the only required value outside the title.
    const payload = {
      Title: title.trim(),
      Description: description.trim() || null,
      EventDate: toIsoInstant(when),
      Location: location.trim() || null,
    };
    try {
      const result = event == null ? await createEvent(payload) : await updateEvent(event.Id, payload);
      onDone(result.Message);
    } catch (err) {
      // A refused write names the clash (title already used on that date).
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  const ready = title.trim().length > 0 && when !== "" && !busy;

  return (
    <div className={`${card} mb-5 p-5`}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <label className={label} htmlFor="ev-title">Title</label>
          <input
            id="ev-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Annual Sports Day"
            className={field}
          />
        </div>
        <div>
          <label className={label} htmlFor="ev-when">Date and time</label>
          <input
            id="ev-when"
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            className={field}
          />
        </div>
        <div>
          <label className={label} htmlFor="ev-location">Location</label>
          <input
            id="ev-location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="School Ground"
            className={field}
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-4">
          <label className={label} htmlFor="ev-desc">Description</label>
          <textarea
            id="ev-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Optional details for staff and learners."
            className={field}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-1.5">
        <button onClick={onCancel} className={ghostBtn} disabled={busy}>Cancel</button>
        <button onClick={() => void submit()} className={primaryBtn} disabled={!ready}>
          <Save className="h-4 w-4" />
          {busy ? "Saving..." : isEdit ? "Save changes" : "Create event"}
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

/* ------------------------------ list ------------------------------ */

function EventList({
  rows,
  loading,
  error,
  onRetry,
  isAdmin,
  isStaff,
  currentUserId,
  onNotice,
  onChanged,
  onEdit,
  onDeleted,
}: {
  rows: EventItem[];
  loading: boolean;
  error: { message: string; status: number | null } | null;
  onRetry: () => void;
  isAdmin: boolean;
  isStaff: boolean;
  currentUserId: number;
  onNotice: (n: Notice) => void;
  onChanged: () => void;
  onEdit: (event: EventItem) => void;
  onDeleted: (id: number) => void;
}) {
  return (
    <div className={`${card} mb-5 overflow-hidden`}>
      <div className="flex items-center gap-2 border-b border-line px-5 py-3.5 text-[13px] font-semibold text-ink-900">
        <PartyPopper className="h-4 w-4 text-ink-400" strokeWidth={1.9} />
        Calendar
        <span className="text-[12px] font-normal text-ink-500">
          {rows.length} event{rows.length === 1 ? "" : "s"}
        </span>
      </div>

      {error ? (
        <div className="p-5">
          <ErrorState message={error.message} status={error.status} onRetry={onRetry} />
        </div>
      ) : loading ? (
        <div className="space-y-3 p-5">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="grid place-items-center py-16 text-center">
          <PartyPopper className="mb-3 h-6 w-6 text-ink-400" strokeWidth={1.7} />
          <p className="text-[13px] text-ink-500">
            There are no events on the calendar yet.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {rows.map((event) => (
            <EventRow
              key={event.Id}
              event={event}
              isAdmin={isAdmin}
              isStaff={isStaff}
              currentUserId={currentUserId}
              onNotice={onNotice}
              onChanged={onChanged}
              onEdit={onEdit}
              onDeleted={onDeleted}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function EventRow({
  event,
  isAdmin,
  isStaff,
  currentUserId,
  onNotice,
  onChanged,
  onEdit,
  onDeleted,
}: {
  event: EventItem;
  isAdmin: boolean;
  isStaff: boolean;
  currentUserId: number;
  onNotice: (n: Notice) => void;
  onChanged: () => void;
  onEdit: (event: EventItem) => void;
  onDeleted: (id: number) => void;
}) {
  const [responding, setResponding] = useState(false);
  const [showPeople, setShowPeople] = useState(false);

  async function respond(next: string) {
    setResponding(true);
    try {
      if (next === "") {
        await removeParticipant(event.Id, currentUserId);
        onNotice({ tone: "ok", text: "Your response was removed." });
      } else {
        await setRsvp(event.Id, next as EventStatus);
        onNotice({ tone: "ok", text: "Your response was saved." });
      }
      onChanged();
    } catch (err) {
      onNotice({ tone: "err", text: err instanceof Error ? err.message : String(err) });
    } finally {
      setResponding(false);
    }
  }

  async function remove() {
    try {
      const result = await deleteEvent(event.Id);
      onNotice({ tone: "ok", text: result.Message });
      onDeleted(event.Id);
    } catch (err) {
      onNotice({ tone: "err", text: err instanceof Error ? err.message : String(err) });
    }
  }

  return (
    <li className="px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[14px] font-semibold text-ink-900">{event.Title}</span>
            {event.MyStatus && <StatusPill status={event.MyStatus} />}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-ink-500">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" strokeWidth={1.8} />
              {formatEventDate(event.EventDate)}
            </span>
            {event.Location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" strokeWidth={1.8} />
                {event.Location}
              </span>
            )}
            <button
              onClick={() => setShowPeople((v) => !v)}
              className="inline-flex items-center gap-1.5 font-medium text-mint-700 hover:underline"
            >
              <Users className="h-3.5 w-3.5" strokeWidth={1.8} />
              {event.ParticipantCount} response{event.ParticipantCount === 1 ? "" : "s"}
              {showPeople ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          </div>

          {event.Description && (
            <p className="mt-1.5 text-[12.5px] text-ink-600">{event.Description}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor={`ev-rsvp-${event.Id}`}>Your response</label>
          <select
            id={`ev-rsvp-${event.Id}`}
            value={event.MyStatus ?? ""}
            onChange={(e) => void respond(e.target.value)}
            disabled={responding}
            className="rounded-xl border border-line bg-white px-2.5 py-1.5 text-[12.5px] text-ink-900 focus:border-mint-300 focus:outline-none focus:ring-2 focus:ring-mint-100 disabled:opacity-60"
          >
            <option value="">No response</option>
            {EVENT_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {isAdmin && (
            <>
              <button onClick={() => onEdit(event)} className={ghostBtn}>
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
              <button onClick={() => void remove()} className={dangerBtn}>
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {showPeople && (
        <ParticipantList
          eventId={event.Id}
          isStaff={isStaff}
          currentUserId={currentUserId}
          onNotice={onNotice}
          onChanged={onChanged}
        />
      )}
    </li>
  );
}

/* ------------------------------ responses ------------------------------ */

function ParticipantList({
  eventId,
  isStaff,
  currentUserId,
  onNotice,
  onChanged,
}: {
  eventId: number;
  isStaff: boolean;
  currentUserId: number;
  onNotice: (n: Notice) => void;
  onChanged: () => void;
}) {
  const people = useAsync(
    useCallback((signal: AbortSignal) => fetchEventParticipants(eventId, signal), [eventId]),
  );
  const [removing, setRemoving] = useState<number | null>(null);

  const rows = useMemo(() => people.data ?? [], [people.data]);

  async function remove(person: EventParticipant) {
    setRemoving(person.UserId);
    try {
      const result = await removeParticipant(eventId, person.UserId);
      onNotice({ tone: "ok", text: result.Message });
      people.refetch();
      // A staff removal can change the caller's own count, so refresh the list.
      onChanged();
    } catch (err) {
      onNotice({ tone: "err", text: err instanceof Error ? err.message : String(err) });
    } finally {
      setRemoving(null);
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-line bg-line-soft/30 p-3">
      {people.error ? (
        <ErrorState
          message={people.error.message}
          status={people.status}
          onRetry={people.refetch}
        />
      ) : people.loading ? (
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="py-2 text-center text-[12.5px] text-ink-500">
          Nobody has responded to this event yet.
        </p>
      ) : (
        <ul className="divide-y divide-line/60">
          {rows.map((person) => (
            <li
              key={person.UserId}
              className="flex items-center justify-between gap-3 py-1.5 text-[12.5px] text-ink-700"
            >
              <span className="truncate font-medium text-ink-900">{person.Username}</span>
              <span className="flex items-center gap-2">
                <StatusPill status={person.Status} />
                {/* Staff moderate anyone; the caller's own row is handled by the
                    selector above, so it is not duplicated here. */}
                {isStaff && person.UserId !== currentUserId && (
                  <button
                    onClick={() => void remove(person)}
                    disabled={removing === person.UserId}
                    className={dangerBtn}
                  >
                    <Trash2 className="h-3 w-3" />
                    Remove
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
