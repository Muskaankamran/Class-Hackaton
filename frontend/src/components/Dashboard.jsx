import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Bell,
  CalendarCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Plus,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Stethoscope,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { apiRequest, ApiError } from "../api";

const NAVIGATION = {
  patient: [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "discover", label: "Find a doctor", icon: Stethoscope },
    { id: "appointments", label: "My appointments", icon: CalendarDays },
    { id: "assistant", label: "AI care assistant", icon: Sparkles, badge: "AI" },
  ],
  doctor: [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "schedule", label: "Appointments", icon: CalendarDays },
    { id: "availability", label: "Availability", icon: Clock3 },
  ],
  admin: [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "appointments", label: "Appointments", icon: CalendarDays },
    { id: "people", label: "People", icon: Users },
    { id: "analytics", label: "AI insights", icon: Sparkles, badge: "AI" },
  ],
};

const PAGE_TITLES = {
  overview: "Overview",
  discover: "Find a doctor",
  appointments: "Appointments",
  assistant: "Care assistant",
  schedule: "My appointments",
  availability: "Availability",
  people: "People",
  analytics: "AI insights",
};

const WEEKDAYS = [
  ["monday", "Mon"],
  ["tuesday", "Tue"],
  ["wednesday", "Wed"],
  ["thursday", "Thu"],
  ["friday", "Fri"],
  ["saturday", "Sat"],
  ["sunday", "Sun"],
];

function getDoctorForm(doctor) {
  return {
    name: doctor?.name || "",
    email: doctor?.email || "",
    password: "",
    specialization: doctor?.specialization || "",
    qualification: doctor?.qualification || "",
    experience: doctor?.experience ?? "",
    consultationFee: doctor?.consultationFee ?? "",
    profileImage: doctor?.profileImage || "",
    availability: {
      workingDays: doctor?.availability?.workingDays || [],
      startTime: doctor?.availability?.startTime || "",
      endTime: doctor?.availability?.endTime || "",
      appointmentDurationMinutes: doctor?.availability?.appointmentDurationMinutes ?? 30,
    },
  };
}

function initials(name = "") {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "M";
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function appointmentDateTime(appointment) {
  const date = new Date(appointment.appointmentDate).toISOString().slice(0, 10);
  return new Date(`${date}T${appointment.appointmentTime}:00.000Z`);
}

function formatDate(value, options = {}) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
    ...options,
  }).format(new Date(value));
}

function formatTime(date, time) {
  if (!date || !time) return time || "—";
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(`${new Date(date).toISOString().slice(0, 10)}T${time}:00.000Z`));
}

function statusLabel(status) {
  return status ? status[0].toUpperCase() + status.slice(1) : "Unknown";
}

function RoleLabel({ role }) {
  return <span className={`role-tag role-tag--${role}`}>{role}</span>;
}

function StatusPill({ status }) {
  return <span className={`status-pill status-pill--${status}`}>{statusLabel(status)}</span>;
}

function Avatar({ name, tone = "mint", small = false }) {
  return <span className={`avatar avatar--${tone}${small ? " avatar--small" : ""}`}>{initials(name)}</span>;
}

function SectionHeading({ eyebrow, title, action, onAction }) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
      </div>
      {action && <button className="text-button" onClick={onAction} type="button">{action}<ArrowRight size={15} /></button>}
    </div>
  );
}

function StatCard({ label, value, note, icon: Icon, tone = "mint", trend }) {
  return (
    <article className="stat-card">
      <div className={`stat-card__icon stat-card__icon--${tone}`}><Icon size={19} /></div>
      <span className="stat-card__label">{label}</span>
      <strong className="stat-card__value">{value}</strong>
      <span className="stat-card__note">{trend && <span className="stat-card__trend"><ArrowUpRight size={13} />{trend}</span>}{note}</span>
    </article>
  );
}

function EmptyState({ icon: Icon = CalendarDays, title, detail, action, onAction }) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon"><Icon size={21} /></span>
      <strong>{title}</strong>
      <p>{detail}</p>
      {action && <button className="button button--outline button--small" onClick={onAction} type="button">{action}</button>}
    </div>
  );
}

function AppointmentCard({ appointment, role, onStatus, onCancel, onComplete, busy }) {
  const patient = appointment.patient || {};
  const doctor = appointment.doctor || {};
  const person = role === "patient" ? doctor.name : patient.name;
  const supporting = role === "patient"
    ? doctor.specialization
    : role === "doctor" ? patient.email : doctor.email;
  return (
    <article className="appointment-card">
      <div className="appointment-card__date">
        <span>{new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" }).format(new Date(appointment.appointmentDate)).replace(".", "").toUpperCase()}</span>
        <strong>{new Date(appointment.appointmentDate).getUTCDate()}</strong>
      </div>
      <div className="appointment-card__person">
        <Avatar name={person} tone={role === "patient" ? "lavender" : "mint"} small />
        <div><strong>{person || "Account unavailable"}</strong><span>{supporting || "Clinic appointment"}</span></div>
      </div>
      <div className="appointment-card__time"><Clock3 size={15} /><span>{formatTime(appointment.appointmentDate, appointment.appointmentTime)} UTC</span></div>
      <StatusPill status={appointment.status} />
      {role === "doctor" && appointment.status === "pending" && (
        <div className="appointment-card__actions">
          <button aria-label="Approve appointment" className="icon-button icon-button--approve" disabled={busy} onClick={() => onStatus(appointment._id, "approved")} title="Approve" type="button"><Check size={16} /></button>
          <button aria-label="Reject appointment" className="icon-button icon-button--reject" disabled={busy} onClick={() => onStatus(appointment._id, "rejected")} title="Reject" type="button"><X size={16} /></button>
        </div>
      )}
      {role === "doctor" && appointment.status === "approved" && appointmentDateTime(appointment) < new Date() && (
        <button className="button button--outline button--small appointment-card__complete" disabled={busy} onClick={() => onComplete(appointment._id)} type="button">Mark complete</button>
      )}
      {role === "patient" && appointment.status === "pending" && (
        <button className="quiet-button appointment-card__cancel" disabled={busy} onClick={() => onCancel(appointment._id)} type="button">Cancel</button>
      )}
      {role === "admin" && <span className="appointment-card__admin">{patient.name} · {doctor.name}</span>}
      {appointment.reason && <p className="appointment-card__reason"><strong>Visit reason:</strong> {appointment.reason}</p>}
    </article>
  );
}

function DoctorCard({ doctor, onBook, compact = false }) {
  const workingDays = doctor.availability?.workingDays?.map((day) => `${day[0].toUpperCase()}${day.slice(1, 3)}`).join(", ");
  return (
    <article className={`doctor-card${compact ? " doctor-card--compact" : ""}`}>
      <div className="doctor-card__top">
        {doctor.profileImage
          ? <img alt="" className="doctor-card__photo" loading="lazy" referrerPolicy="no-referrer" src={doctor.profileImage} />
          : <Avatar name={doctor.name} tone="mint" />}
        <span className="doctor-card__availability"><i /> Active clinician</span>
      </div>
      <h3>{doctor.name}</h3>
      <p>{doctor.specialization || "General practice"}</p>
      <div className="doctor-card__meta">
        {doctor.qualification && <span><ShieldCheck size={14} /> {doctor.qualification}</span>}
        <span><ShieldCheck size={14} /> {doctor.experience ?? 0} years experience</span>
        <span><CalendarDays size={14} /> {workingDays || "Availability not set"}</span>
        {doctor.consultationFee !== undefined && <span><CheckCircle2 size={14} /> Consultation fee: {doctor.consultationFee} / visit</span>}
      </div>
      <button className="button button--outline button--small doctor-card__button" onClick={() => onBook(doctor)} type="button">
        Book appointment <ArrowRight size={15} />
      </button>
    </article>
  );
}

function AppointmentList({ appointments, role, onStatus, onCancel, onComplete, busyId, onBrowse }) {
  if (!appointments.length) {
    return <EmptyState action={role === "patient" ? "Find a doctor" : undefined} detail={role === "doctor" ? "New appointment requests will appear here." : "Your upcoming care will be easy to find here."} icon={CalendarCheck} onAction={onBrowse} title="Nothing scheduled yet" />;
  }
  return (
    <div className="appointment-list">
      {appointments.map((appointment) => (
        <AppointmentCard
          appointment={appointment}
          busy={busyId === appointment._id}
          key={appointment._id}
          onCancel={onCancel}
          onComplete={onComplete}
          onStatus={onStatus}
          role={role}
        />
      ))}
    </div>
  );
}

function AssistantPanel({ token, compact = false }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function sendMessage(event) {
    event.preventDefault();
    const message = input.trim();
    if (!message || busy) return;
    setInput("");
    setError("");
    setMessages((items) => [...items, { role: "user", text: message }]);
    setBusy(true);
    try {
      const response = await apiRequest("/ai/assistant", {
        method: "POST",
        token,
        body: { message },
      });
      setMessages((items) => [...items, { role: "assistant", text: response.reply, aiAvailable: response.aiAvailable }]);
    } catch (requestError) {
      setError(requestError.message || "The assistant couldn't respond. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={`assistant-panel${compact ? " assistant-panel--compact" : ""}`}>
      <div className="assistant-panel__header">
        <span className="assistant-panel__spark"><Sparkles size={18} /></span>
        <div><h3>MediAura assistant</h3><span><i /> {busy ? "Thinking" : "Here to help"}</span></div>
        <span className="ai-tag">AI</span>
      </div>
      <div className="assistant-panel__messages" aria-live="polite">
        {!messages.length && (
          <div className="assistant-welcome">
            <span className="assistant-welcome__icon"><HeartPulse size={19} /></span>
            <strong>Hi, {compact ? "there" : "I'm here to help"}.</strong>
            <p>Ask me how to book, what to expect, or which specialties are available at your clinic.</p>
            <span className="assistant-prompt">What happens after I book?</span>
          </div>
        )}
        {messages.map((message, index) => (
          <div className={`chat-message chat-message--${message.role}`} key={`${message.role}-${index}`}>
            {message.role === "assistant" && <span className="chat-message__label"><Sparkles size={12} />{message.aiAvailable ? "AI-generated" : "Booking guidance · AI offline"}</span>}
            <p>{message.text}</p>
          </div>
        ))}
        {busy && <div className="chat-typing"><i /><i /><i /><span>Putting together a helpful answer</span></div>}
      </div>
      {error && <p className="inline-error">{error}</p>}
      <form className="assistant-input" onSubmit={sendMessage}>
        <input aria-label="Message the MediAura assistant" maxLength={1000} onChange={(event) => setInput(event.target.value)} placeholder="Ask a question..." value={input} />
        <button aria-label="Send message" disabled={busy || !input.trim()} type="submit"><Send size={16} /></button>
      </form>
      <p className="assistant-panel__privacy">Please don't share your name, contact details, or other identifying information. Not medical advice.</p>
    </section>
  );
}

function RecommendationPanel({ token, doctors, onBook }) {
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const response = await apiRequest("/ai/recommendations", {
        method: "POST",
        token,
        body: { reason, noPersonalInfo: confirmed },
      });
      setResult(response);
    } catch (requestError) {
      setError(requestError.message || "We couldn't create recommendations right now.");
    } finally {
      setBusy(false);
    }
  }

  const suggestedDoctors = result?.aiAvailable
    ? result.recommendations
    : [];
  return (
    <section className="recommendation-card">
      <div className="recommendation-card__intro">
        <span className="recommendation-card__icon"><Sparkles size={19} /></span>
        <div><span className="eyebrow">Thoughtful doctor discovery</span><h2>Not sure where to start?</h2><p>Share a brief, non-identifying description and AI can suggest a specialty from your clinic's active doctors.</p></div>
        <span className="ai-tag">AI</span>
      </div>
      <form className="recommendation-form" onSubmit={submit}>
        <label className="field">
          <span>What would you like help with?</span>
          <textarea maxLength={1000} onChange={(event) => setReason(event.target.value)} placeholder="For example: I’d like to discuss recurring joint discomfort." required rows={3} value={reason} />
        </label>
        <label className="privacy-check">
          <input checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} required type="checkbox" />
          <span>I confirm this description has no names, contact details, or other identifying information.</span>
        </label>
        <div className="recommendation-form__footer">
          <span><ShieldCheck size={14} /> Only general health-topic terms are shared with AI.</span>
          <button className="button button--primary button--small" disabled={busy || !confirmed || !reason.trim()} type="submit">{busy ? <span className="spinner" /> : <><Sparkles size={15} /> Suggest specialties</>}</button>
        </div>
      </form>
      {error && <div className="form-alert">{error}</div>}
      {result && (
        <div className="recommendation-results">
          {result.aiAvailable ? (
            <>
              <span className="recommendation-results__label"><Sparkles size={14} /> AI-generated suggestions · not a diagnosis</span>
              {result.specializations?.length > 0
                ? <p>These active clinic specialties may be a useful place to start: <strong>{result.specializations.join(", ")}</strong>.</p>
                : <p>AI couldn't match a specialty from the clinic's current list. Browse the active doctors below.</p>}
              <div className="doctor-grid doctor-grid--recommendations">
                {suggestedDoctors.map((doctor) => <DoctorCard doctor={doctor} key={doctor._id} onBook={onBook} compact />)}
              </div>
            </>
          ) : (
            <div className="recommendation-fallback"><AlertCircle size={16} /><span>{result.message} These are the doctors currently in your clinic directory; they are not AI recommendations.</span></div>
          )}
        </div>
      )}
      <p className="medical-boundary">MediAura does not diagnose, prescribe, or replace advice from a licensed medical professional.</p>
      {!doctors.length && <span className="sr-only">No active clinic doctors are currently listed.</span>}
    </section>
  );
}

function NotificationsPanel({ notifications, onClose }) {
  return (
    <div className="notifications-popover">
      <div className="notifications-popover__head"><div><strong>Notifications</strong><span>Updates from your appointments</span></div><button aria-label="Close notifications" className="icon-button" onClick={onClose} type="button"><X size={17} /></button></div>
      {notifications.length ? notifications.slice(0, 6).map((item) => (
        <div className="notification-item" key={item._id}>
          <span className={`notification-item__dot notification-item__dot--${item.status}`} />
          <div><strong>{statusLabel(item.status)} appointment</strong><span>{item.title} · {formatDate(item.appointmentDate)}</span></div>
          <StatusPill status={item.status} />
        </div>
      )) : <EmptyState detail="Appointment updates will show here." icon={Bell} title="All caught up" />}
      <p className="notifications-popover__note">Notifications reflect live appointment records.</p>
    </div>
  );
}

function BookingModal({ doctor, token, onClose, onBooked }) {
  const [date, setDate] = useState(getToday());
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [availability, setAvailability] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const availabilityKey = doctor ? `${doctor._id}:${date}` : "";
  const checking = availability?.key !== availabilityKey;
  const slots = checking ? [] : availability.slots;

  useEffect(() => {
    if (!doctor || !date) return undefined;
    const controller = new AbortController();
    apiRequest(`/appointments/availability?doctorId=${encodeURIComponent(doctor._id)}&date=${encodeURIComponent(date)}`, { token, signal: controller.signal })
      .then((result) => setAvailability({
        key: `${doctor._id}:${date}`,
        slots: result.availableSlots || [],
        workingDays: result.workingDays || [],
        schedule: result.schedule || null,
        error: "",
      }))
      .catch((requestError) => {
        if (requestError.name !== "AbortError") {
          setAvailability({
            key: `${doctor._id}:${date}`,
            slots: [],
            error: requestError.message || "Couldn't check availability.",
          });
        }
      })
    return () => controller.abort();
  }, [doctor, date, token]);

  async function book(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await apiRequest("/appointments", {
        method: "POST",
        token,
        body: { doctor: doctor._id, appointmentDate: date, appointmentTime: time, reason },
      });
      onBooked();
    } catch (requestError) {
      setError(requestError.message || "We couldn't book this appointment. Please choose another time.");
    } finally {
      setBusy(false);
    }
  }

  if (!doctor) return null;
  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }} role="presentation">
      <section aria-labelledby="booking-title" aria-modal="true" className="modal booking-modal" role="dialog">
        <div className="modal__head"><div><span className="eyebrow">A good next step</span><h2 id="booking-title">Book with {doctor.name}</h2><p>{doctor.specialization} · {doctor.qualification || "Qualification not listed"} · {doctor.experience} years · Fee {doctor.consultationFee ?? "not listed"}</p></div><button aria-label="Close booking dialog" className="icon-button" onClick={onClose} type="button"><X size={19} /></button></div>
        <form onSubmit={book}>
          <div className="booking-date-row">
            <label className="field"><span>Choose a date</span><input min={getToday()} onChange={(event) => { setDate(event.target.value); setTime(""); setError(""); }} required type="date" value={date} /></label>
            <div className="booking-legend"><span><i /> Available</span><span><i /> Unavailable</span></div>
          </div>
          <div className="time-grid" aria-label="Appointment times">
            {slots.map((slot) => <button aria-pressed={time === slot} className={`time-slot${time === slot ? " is-selected" : ""}`} key={slot} onClick={() => setTime(slot)} type="button">{slot}</button>)}
          </div>
          <span className="field-hint">{checking ? "Checking live availability…" : availability?.error || (slots.length ? "Available slots only · times are shown in UTC." : "No available appointments on this date; select another working day.")}</span>
          <label className="field booking-reason"><span>Reason for your visit</span><textarea maxLength={1000} onChange={(event) => setReason(event.target.value)} placeholder="A brief note for your doctor" required rows={3} value={reason} /></label>
          {error && <div className="form-alert" role="alert">{error}</div>}
          <div className="modal__footer"><button className="button button--ghost" onClick={onClose} type="button">Cancel</button><button className="button button--primary" disabled={busy || checking || !slots.includes(time) || !reason.trim()} type="submit">{busy ? <span className="spinner" /> : <><CalendarCheck size={16} /> Request appointment</>}</button></div>
        </form>
      </section>
    </div>
  );
}

export default function Dashboard({ session, onLogout }) {
  const { token, user } = session;
  const [page, setPage] = useState("overview");
  const [data, setData] = useState({ doctors: [], appointments: [], users: [], stats: null, analytics: null });
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [notice, setNotice] = useState("");
  const [actionId, setActionId] = useState("");
  const [bookingDoctor, setBookingDoctor] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [doctorSearch, setDoctorSearch] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");
  const [peopleFilter, setPeopleFilter] = useState("all");
  const [showDoctorForm, setShowDoctorForm] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [doctorForm, setDoctorForm] = useState(() => getDoctorForm());
  const [doctorFormError, setDoctorFormError] = useState("");
  const [doctorFormBusy, setDoctorFormBusy] = useState(false);
  const [doctorAvailability, setDoctorAvailability] = useState(() => ({
    workingDays: user.availability?.workingDays || [],
    startTime: user.availability?.startTime || "",
    endTime: user.availability?.endTime || "",
    appointmentDurationMinutes: user.availability?.appointmentDurationMinutes ?? 30,
  }));
  const [availabilityBusy, setAvailabilityBusy] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setPageError("");
    try {
      if (user.role === "patient") {
        const [appointments, doctors] = await Promise.all([
          apiRequest("/appointments/my", { token }),
          apiRequest("/doctors", { token }),
        ]);
        setData((current) => ({ ...current, appointments: appointments.appointments || [], doctors: doctors.doctors || [] }));
      } else if (user.role === "doctor") {
        const response = await apiRequest("/appointments/doctor", { token });
        setData((current) => ({ ...current, appointments: response.appointments || [] }));
      } else {
        const [stats, appointments, users, analytics] = await Promise.all([
          apiRequest("/admin/stats", { token }),
          apiRequest("/admin/appointments", { token }),
          apiRequest("/admin/users", { token }),
          apiRequest("/ai/analytics", { token }),
        ]);
        setData((current) => ({
          ...current,
          stats,
          appointments: appointments.appointments || [],
          users: users.users || [],
          analytics,
        }));
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        onLogout();
        return;
      }
      setPageError(error.message || "We couldn't load your MediAura workspace.");
    } finally {
      setLoading(false);
    }
  }, [onLogout, token, user.role]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => loadData());
    return () => window.cancelAnimationFrame(frame);
  }, [loadData]);

  const appointments = data.appointments;
  const navItems = NAVIGATION[user.role] || NAVIGATION.patient;
  const specialties = useMemo(
    () => [...new Set(data.doctors.map((doctor) => doctor.specialization).filter(Boolean))].sort(),
    [data.doctors],
  );
  const filteredDoctors = useMemo(() => data.doctors.filter((doctor) => {
    const matchesText = `${doctor.name} ${doctor.specialization}`.toLowerCase().includes(doctorSearch.trim().toLowerCase());
    const matchesSpecialty = specialtyFilter === "all" || doctor.specialization === specialtyFilter;
    return matchesText && matchesSpecialty;
  }), [data.doctors, doctorSearch, specialtyFilter]);
  const upcoming = useMemo(
    () => appointments.filter((item) => appointmentDateTime(item) >= new Date() && item.status !== "cancelled" && item.status !== "rejected")
      .sort((a, b) => appointmentDateTime(a) - appointmentDateTime(b)),
    [appointments],
  );
  const recentNotifications = useMemo(() => appointments
    .slice()
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
    .map((item) => ({
      ...item,
      title: user.role === "patient" ? item.doctor?.name : item.patient?.name,
    })), [appointments, user.role]);

  function showNotice(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3800);
  }

  async function changeAppointmentStatus(id, status) {
    setActionId(id);
    try {
      await apiRequest(`/appointments/${id}/status`, { method: "PATCH", token, body: { status } });
      showNotice(`Appointment ${status}.`);
      await loadData();
    } catch (error) {
      showNotice(error.message || "The appointment could not be updated.");
    } finally {
      setActionId("");
    }
  }

  async function cancelAppointment(id) {
    setActionId(id);
    try {
      await apiRequest(`/appointments/${id}/cancel`, { method: "PATCH", token, body: {} });
      showNotice("Your appointment request was cancelled.");
      await loadData();
    } catch (error) {
      showNotice(error.message || "The appointment could not be cancelled.");
    } finally {
      setActionId("");
    }
  }

  async function completeAppointment(id) {
    setActionId(id);
    try {
      await apiRequest(`/appointments/${id}/complete`, { method: "PATCH", token, body: {} });
      showNotice("Appointment marked completed.");
      await loadData();
    } catch (error) {
      showNotice(error.message || "The appointment could not be completed.");
    } finally {
      setActionId("");
    }
  }

  async function bookComplete() {
    setBookingDoctor(null);
    showNotice("Appointment request sent to your doctor.");
    await loadData();
  }

  async function changeAccountStatus(account, isActive) {
    setActionId(account._id);
    try {
      await apiRequest(`/admin/users/${account._id}/status`, { method: "PATCH", token, body: { isActive } });
      showNotice(`${account.name} ${isActive ? "activated" : "deactivated"}.`);
      await loadData();
    } catch (error) {
      showNotice(error.message || "The account status could not be changed.");
    } finally {
      setActionId("");
    }
  }

  async function removeAccount(account) {
    if (!window.confirm(`Remove ${account.name}'s account? Existing appointment history will remain.`)) return;
    setActionId(account._id);
    try {
      await apiRequest(`/admin/users/${account._id}`, { method: "DELETE", token });
      showNotice("Account removed.");
      await loadData();
    } catch (error) {
      showNotice(error.message || "The account could not be removed.");
    } finally {
      setActionId("");
    }
  }

  async function createDoctor(event) {
    event.preventDefault();
    setDoctorFormBusy(true);
    setDoctorFormError("");
    try {
      const payload = {
        ...doctorForm,
        experience: Number(doctorForm.experience),
        consultationFee: Number(doctorForm.consultationFee),
        availability: {
          ...doctorForm.availability,
          appointmentDurationMinutes: Number(doctorForm.availability.appointmentDurationMinutes),
        },
      };
      if (editingDoctor) delete payload.password;
      await apiRequest(editingDoctor ? `/admin/doctors/${editingDoctor._id}` : "/admin/doctors", {
        method: editingDoctor ? "PATCH" : "POST",
        token,
        body: payload,
      });
      setDoctorForm(getDoctorForm());
      const wasEditing = Boolean(editingDoctor);
      setEditingDoctor(null);
      setShowDoctorForm(false);
      showNotice(wasEditing ? "Doctor details updated." : "Doctor account created.");
      await loadData();
    } catch (error) {
      setDoctorFormError(error.message || "The doctor account could not be created.");
    } finally {
      setDoctorFormBusy(false);
    }
  }

  function editDoctor(doctor) {
    setEditingDoctor(doctor);
    setDoctorForm(getDoctorForm(doctor));
    setDoctorFormError("");
    setShowDoctorForm(true);
  }

  function openDoctorForm() {
    setEditingDoctor(null);
    setDoctorForm(getDoctorForm());
    setDoctorFormError("");
    setShowDoctorForm(true);
  }

  async function saveDoctorAvailability(event) {
    event.preventDefault();
    setAvailabilityBusy(true);
    try {
      const response = await apiRequest("/doctors/me/availability", {
        method: "PATCH",
        token,
        body: {
          ...doctorAvailability,
          appointmentDurationMinutes: Number(doctorAvailability.appointmentDurationMinutes),
        },
      });
      setDoctorAvailability(response.doctor.availability);
      showNotice("Your availability has been updated.");
    } catch (error) {
      showNotice(error.message || "Availability could not be saved.");
    } finally {
      setAvailabilityBusy(false);
    }
  }

  function updateDoctorAvailability(field, value) {
    setDoctorAvailability((current) => ({ ...current, [field]: value }));
  }

  function toggleDoctorWorkingDay(day) {
    setDoctorAvailability((current) => ({
      ...current,
      workingDays: current.workingDays.includes(day)
        ? current.workingDays.filter((item) => item !== day)
        : [...current.workingDays, day],
    }));
  }

  function setActivePage(nextPage) {
    setPage(nextPage);
    setMobileNavOpen(false);
    setShowNotifications(false);
  }

  const displayName = user.name?.split(" ")[0] || user.username || "there";
  const pageDescription = user.role === "patient"
    ? "Your care, appointments, and next steps in one calm place."
    : user.role === "doctor"
      ? "A clear view of your schedule and patient requests."
      : "A real-time view of your clinic and its appointments.";

  return (
    <div className={`app-shell${mobileNavOpen ? " app-shell--nav-open" : ""}`}>
      {mobileNavOpen && <button aria-label="Close navigation" className="mobile-scrim" onClick={() => setMobileNavOpen(false)} type="button" />}
      <aside className="sidebar">
        <div className="sidebar__brand-row">
          <a className="brand" href="/" aria-label="MediAura home">
            <span className="brand__mark"><HeartPulse size={20} /></span><span className="brand__name">MediAura<span>.</span></span>
          </a>
          <button aria-label="Close navigation" className="icon-button sidebar__close" onClick={() => setMobileNavOpen(false)} type="button"><X size={18} /></button>
        </div>
        <div className="sidebar__workspace"><span className="workspace-mark"><Activity size={15} /></span><div><strong>Care workspace</strong><span>{user.role === "admin" ? "Clinic administration" : user.role === "doctor" ? "Clinical practice" : "Personal health"}</span></div><ChevronDown size={15} /></div>
        <span className="sidebar__label">WORKSPACE</span>
        <nav className="sidebar-nav" aria-label="Main navigation">
          {navItems.map(({ id, label, icon: Icon, badge }) => (
            <button className={`sidebar-nav__item${page === id ? " is-active" : ""}`} key={id} onClick={() => setActivePage(id)} type="button">
              <Icon size={18} strokeWidth={1.8} /><span>{label}</span>{badge && <small>{badge}</small>}
            </button>
          ))}
        </nav>
        <div className="sidebar__spacer" />
        <div className="sidebar-help"><span className="sidebar-help__icon"><MessageCircle size={17} /></span><strong>Need a hand?</strong><p>{user.role === "patient" ? "Your care assistant can help you find your next step." : "Your workspace is connected to live clinic data."}</p>{user.role === "patient" && <button onClick={() => setActivePage("assistant")} type="button">Ask MediAura <ArrowRight size={14} /></button>}</div>
        <div className="sidebar__profile">
          <Avatar name={user.name} tone="lavender" small />
          <div className="sidebar__profile-copy"><strong>{user.name || user.username}</strong><span>{user.role === "doctor" && user.specialization ? user.specialization : user.role}</span></div>
          <button aria-label="Sign out" className="icon-button" onClick={onLogout} title="Sign out" type="button"><LogOut size={17} /></button>
        </div>
      </aside>

      <main className="main-shell">
        <header className="topbar">
          <button aria-label="Open navigation" className="icon-button topbar__menu" onClick={() => setMobileNavOpen(true)} type="button"><Menu size={20} /></button>
          <div className="topbar__title"><span className="eyebrow">{PAGE_TITLES[page] || "Workspace"}</span><p>{pageDescription}</p></div>
          <div className="topbar__actions">
            <div className="topbar__date"><CalendarDays size={15} /><span>{new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric" }).format(new Date())}</span></div>
            <div className="notification-anchor">
              <button aria-label="Open notifications" aria-expanded={showNotifications} className={`icon-button notification-button${showNotifications ? " is-open" : ""}`} onClick={() => setShowNotifications((value) => !value)} type="button"><Bell size={18} />{recentNotifications.length > 0 && <i />}</button>
              {showNotifications && <NotificationsPanel notifications={recentNotifications} onClose={() => setShowNotifications(false)} />}
            </div>
            <div className="topbar__user"><Avatar name={user.name} tone={user.role === "doctor" ? "mint" : "lavender"} small /><span>{displayName}</span></div>
          </div>
        </header>

        <div className="page-content">
          {pageError && <div className="page-error" role="alert"><AlertCircle size={17} /><span>{pageError}</span><button className="text-button" onClick={loadData} type="button">Try again</button></div>}
          {loading && !data.appointments.length && !data.doctors.length && !data.users.length
            ? <LoadingState />
            : (
              <>
                {user.role === "patient" && page === "overview" && <PatientOverview user={user} appointments={appointments} doctors={data.doctors} upcoming={upcoming} token={token} onBook={setBookingDoctor} onNavigate={setActivePage} />}
                {user.role === "patient" && page === "discover" && (
                  <PatientDiscover doctors={filteredDoctors} specialties={specialties} search={doctorSearch} filter={specialtyFilter} onSearch={setDoctorSearch} onFilter={setSpecialtyFilter} onBook={setBookingDoctor} token={token} />
                )}
                {user.role === "patient" && page === "appointments" && (
                  <AppointmentsPage appointments={appointments} role="patient" onCancel={cancelAppointment} busyId={actionId} onBrowse={() => setActivePage("discover")} />
                )}
                {user.role === "patient" && page === "assistant" && <AssistantPage token={token} />}
                {user.role === "doctor" && page === "overview" && <DoctorOverview appointments={appointments} onNavigate={setActivePage} onStatus={changeAppointmentStatus} onComplete={completeAppointment} busyId={actionId} />}
                {user.role === "doctor" && page === "schedule" && <AppointmentsPage appointments={appointments} role="doctor" onStatus={changeAppointmentStatus} onComplete={completeAppointment} busyId={actionId} />}
                {user.role === "doctor" && page === "availability" && <DoctorAvailabilityPage availability={doctorAvailability} busy={availabilityBusy} onChange={updateDoctorAvailability} onSave={saveDoctorAvailability} onToggleDay={toggleDoctorWorkingDay} />}
                {user.role === "admin" && page === "overview" && <AdminOverview stats={data.stats} appointments={appointments} analytics={data.analytics} onNavigate={setActivePage} />}
                {user.role === "admin" && page === "appointments" && <AppointmentsPage appointments={appointments} role="admin" />}
                {user.role === "admin" && page === "people" && (
                  <PeoplePage users={data.users} filter={peopleFilter} onFilter={setPeopleFilter} onCreate={openDoctorForm} onEdit={editDoctor} onStatus={changeAccountStatus} onDelete={removeAccount} busyId={actionId} />
                )}
                {user.role === "admin" && page === "analytics" && <AnalyticsPage analytics={data.analytics} />}
              </>
            )}
        </div>
      </main>

      {notice && <div className="toast-message" role="status"><CheckCircle2 size={17} />{notice}<button aria-label="Dismiss notification" onClick={() => setNotice("")} type="button"><X size={15} /></button></div>}
      {bookingDoctor && <BookingModal doctor={bookingDoctor} onBooked={bookComplete} onClose={() => setBookingDoctor(null)} token={token} />}
      {showDoctorForm && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowDoctorForm(false); }} role="presentation">
          <section aria-labelledby="doctor-modal-title" aria-modal="true" className="modal doctor-modal" role="dialog">
            <div className="modal__head"><div><span className="eyebrow">Clinic directory</span><h2 id="doctor-modal-title">{editingDoctor ? "Edit doctor" : "Add a doctor"}</h2><p>{editingDoctor ? "Update clinician details and working hours." : "Create a sign-in account and configure the clinician’s schedule."}</p></div><button aria-label="Close dialog" className="icon-button" onClick={() => setShowDoctorForm(false)} type="button"><X size={19} /></button></div>
            <form className="doctor-create-form" onSubmit={createDoctor}>
              <label className="field"><span>Full name</span><input autoComplete="name" onChange={(event) => setDoctorForm((current) => ({ ...current, name: event.target.value }))} required value={doctorForm.name} /></label>
              <label className="field"><span>Email address</span><input autoComplete="email" onChange={(event) => setDoctorForm((current) => ({ ...current, email: event.target.value }))} required type="email" value={doctorForm.email} /></label>
              {!editingDoctor && <label className="field"><span>Temporary password</span><input autoComplete="new-password" minLength={8} onChange={(event) => setDoctorForm((current) => ({ ...current, password: event.target.value }))} required type="password" value={doctorForm.password} /></label>}
              <div className="doctor-create-form__row">
                <label className="field"><span>Specialization</span><input onChange={(event) => setDoctorForm((current) => ({ ...current, specialization: event.target.value }))} required value={doctorForm.specialization} /></label>
                <label className="field"><span>Qualification</span><input onChange={(event) => setDoctorForm((current) => ({ ...current, qualification: event.target.value }))} required value={doctorForm.qualification} /></label>
                <label className="field"><span>Years of experience</span><input min="0" onChange={(event) => setDoctorForm((current) => ({ ...current, experience: event.target.value }))} required type="number" value={doctorForm.experience} /></label>
                <label className="field"><span>Consultation fee</span><input min="0" onChange={(event) => setDoctorForm((current) => ({ ...current, consultationFee: event.target.value }))} required type="number" value={doctorForm.consultationFee} /></label>
              </div>
              <label className="field"><span>Profile image URL (optional)</span><input onChange={(event) => setDoctorForm((current) => ({ ...current, profileImage: event.target.value }))} placeholder="https://…" type="url" value={doctorForm.profileImage} /></label>
              <fieldset className="availability-fieldset">
                <legend>Working days</legend>
                <div className="working-days">
                  {WEEKDAYS.map(([day, label]) => <label key={day}><input checked={doctorForm.availability.workingDays.includes(day)} onChange={() => setDoctorForm((current) => ({ ...current, availability: { ...current.availability, workingDays: current.availability.workingDays.includes(day) ? current.availability.workingDays.filter((item) => item !== day) : [...current.availability.workingDays, day] } }))} type="checkbox" /><span>{label}</span></label>)}
                </div>
              </fieldset>
              <div className="doctor-create-form__row">
                <label className="field"><span>Starting time (UTC)</span><input onChange={(event) => setDoctorForm((current) => ({ ...current, availability: { ...current.availability, startTime: event.target.value } }))} required type="time" value={doctorForm.availability.startTime} /></label>
                <label className="field"><span>Ending time (UTC)</span><input onChange={(event) => setDoctorForm((current) => ({ ...current, availability: { ...current.availability, endTime: event.target.value } }))} required type="time" value={doctorForm.availability.endTime} /></label>
                <label className="field"><span>Appointment duration (minutes)</span><input max="240" min="5" onChange={(event) => setDoctorForm((current) => ({ ...current, availability: { ...current.availability, appointmentDurationMinutes: event.target.value } }))} required step="5" type="number" value={doctorForm.availability.appointmentDurationMinutes} /></label>
              </div>
              {doctorFormError && <div className="form-alert" role="alert">{doctorFormError}</div>}
              <div className="modal__footer"><button className="button button--ghost" onClick={() => setShowDoctorForm(false)} type="button">Cancel</button><button className="button button--primary" disabled={doctorFormBusy} type="submit">{doctorFormBusy ? <span className="spinner" /> : <><UserPlus size={16} /> {editingDoctor ? "Save changes" : "Create doctor"}</>}</button></div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

function LoadingState() {
  return <div className="loading-state"><span className="spinner spinner--large" /><p>Opening your care workspace…</p></div>;
}

function PatientOverview({ user, appointments, doctors, upcoming, token, onBook, onNavigate }) {
  const next = upcoming[0];
  return (
    <div className="dashboard-stack">
      <section className="welcome-banner">
        <div className="welcome-banner__content">
          <span className="eyebrow eyebrow--light"><Sparkles size={14} /> A little more clarity, every day</span>
          <h1>Good to see you, {user.name?.split(" ")[0] || "there"}.</h1>
          <p>Your health journey is personal. We’re here to make the next step feel simple.</p>
          <button className="button button--light" onClick={() => onNavigate("discover")} type="button">Find a doctor <ArrowRight size={16} /></button>
        </div>
        <div className="welcome-banner__art" aria-hidden="true">
          <div className="welcome-art__ring welcome-art__ring--outer" /><div className="welcome-art__ring welcome-art__ring--inner" />
          <div className="welcome-art__heart"><HeartPulse size={47} strokeWidth={1.5} /></div>
          <span className="welcome-art__spark welcome-art__spark--one">✦</span><span className="welcome-art__spark welcome-art__spark--two">✧</span>
        </div>
        <span className="welcome-banner__corner">M</span>
      </section>

      <div className="stat-grid stat-grid--patient">
        <StatCard icon={CalendarCheck} label="Upcoming visits" note="scheduled with your care team" value={upcoming.length} />
        <StatCard icon={Clock3} label="Awaiting confirmation" note="your doctor will review shortly" tone="lavender" value={appointments.filter((item) => item.status === "pending").length} />
        <StatCard icon={Stethoscope} label="Doctors to discover" note="active clinicians in your clinic" tone="ivory" value={doctors.length} />
      </div>

      <div className="content-grid content-grid--patient">
        <section className="surface-card">
          <SectionHeading action="View all" onAction={() => onNavigate("appointments")} title="Your next steps" />
          {next ? <AppointmentList appointments={[next]} role="patient" onBrowse={() => onNavigate("discover")} /> : <EmptyState action="Explore doctors" detail="When you book a visit, your appointment will appear here." icon={CalendarDays} onAction={() => onNavigate("discover")} title="Your calendar is open" />}
          <div className="surface-card__divider" />
          <div className="inline-section-heading"><div><h3>Care, close to home</h3><p>Discover an active doctor from your clinic.</p></div><button className="quiet-button" onClick={() => onNavigate("discover")} type="button">Explore <ArrowRight size={14} /></button></div>
          {doctors.length ? <div className="doctor-mini-list">{doctors.slice(0, 3).map((doctor) => <button className="doctor-mini" key={doctor._id} onClick={() => onBook(doctor)} type="button"><Avatar name={doctor.name} small /><span><strong>{doctor.name}</strong><small>{doctor.specialization} · {doctor.experience} yrs</small></span><ArrowRight size={15} /></button>)}</div> : <p className="muted-copy">No active doctors are listed yet.</p>}
        </section>
        <div className="patient-side-stack">
          <AssistantPanel compact token={token} />
          <section className="privacy-card"><span><ShieldCheck size={17} /></span><div><strong>Your care stays yours</strong><p>Only share identifying details directly with your healthcare provider.</p></div></section>
        </div>
      </div>
    </div>
  );
}

function PatientDiscover({ doctors, specialties, search, filter, onSearch, onFilter, onBook, token }) {
  return (
    <div className="dashboard-stack">
      <section className="page-intro-row"><div><span className="eyebrow">Meet your care team</span><h1>Find the right doctor</h1><p>Explore active clinicians at your clinic, or get an AI specialty suggestion.</p></div><span className="directory-count"><strong>{doctors.length}</strong> {doctors.length === 1 ? "doctor" : "doctors"}</span></section>
      <RecommendationPanel doctors={doctors} onBook={onBook} token={token} />
      <section className="surface-card">
        <SectionHeading eyebrow="Clinic directory" title="Available doctors" />
        <div className="filter-toolbar">
          <label className="search-field"><Search size={17} /><input aria-label="Search doctors" onChange={(event) => onSearch(event.target.value)} placeholder="Search by name or specialty" value={search} />{search && <button aria-label="Clear search" onClick={() => onSearch("")} type="button"><X size={15} /></button>}</label>
          <label className="select-field"><SlidersHorizontal size={16} /><select aria-label="Filter by specialty" onChange={(event) => onFilter(event.target.value)} value={filter}><option value="all">All specialties</option>{specialties.map((specialty) => <option key={specialty} value={specialty}>{specialty}</option>)}</select></label>
        </div>
        {doctors.length ? <div className="doctor-grid">{doctors.map((doctor) => <DoctorCard doctor={doctor} key={doctor._id} onBook={onBook} />)}</div> : <EmptyState detail="Try another search, or check back when your clinic adds a doctor." icon={Stethoscope} title="No doctors match this search" />}
      </section>
    </div>
  );
}

function AssistantPage({ token }) {
  return (
    <div className="assistant-page">
      <div className="page-intro-row"><div><span className="eyebrow">Here for the little questions</span><h1>Your care assistant</h1><p>Get help navigating appointments and the specialties available at your clinic.</p></div><span className="ai-tag ai-tag--large"><Sparkles size={14} /> AI-assisted</span></div>
      <div className="assistant-page__grid">
        <AssistantPanel token={token} />
        <aside className="assistant-guidance">
          <div className="assistant-guidance__icon"><ShieldCheck size={19} /></div>
          <span className="eyebrow">A helpful boundary</span>
          <h2>Care navigation, not medical advice.</h2>
          <p>MediAura can explain appointment steps and clinic specialties. It can’t diagnose conditions, recommend medication, or replace a licensed medical professional.</p>
          <div className="assistant-guidance__line" />
          <strong>Before you begin</strong>
          <ul><li>Leave out names and contact details.</li><li>For health concerns, contact a clinician.</li><li>For urgent symptoms, seek local emergency care.</li></ul>
        </aside>
      </div>
    </div>
  );
}

function AppointmentsPage({ appointments, role, onStatus, onCancel, onComplete, busyId, onBrowse }) {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "upcoming"
    ? appointments.filter((item) => appointmentDateTime(item) >= new Date() && ["pending", "approved"].includes(item.status))
    : filter === "all" ? appointments : appointments.filter((item) => item.status === filter);
  const isPatient = role === "patient";
  return (
    <div className="dashboard-stack">
      <section className="page-intro-row"><div><span className="eyebrow">{role === "admin" ? "Clinic operations" : role === "doctor" ? "Your clinical schedule" : "Your care timeline"}</span><h1>{isPatient ? "My appointments" : role === "doctor" ? "Appointment requests" : "All appointments"}</h1><p>{isPatient ? "Every request and update, gathered in one place." : role === "doctor" ? "Review requests and keep your schedule up to date." : "Monitor appointment activity across your clinic."}</p></div>{isPatient && <button className="button button--primary" onClick={onBrowse} type="button"><Plus size={16} /> Book a visit</button>}</section>
      <section className="surface-card appointment-page-card">
        <div className="appointment-toolbar"><div><strong>{appointments.length} {appointments.length === 1 ? "appointment" : "appointments"}</strong><span>Live from your clinic database</span></div><label className="select-field select-field--compact"><SlidersHorizontal size={15} /><select aria-label="Filter appointments" onChange={(event) => setFilter(event.target.value)} value={filter}><option value="all">All appointments</option>{role === "doctor" && <option value="upcoming">Upcoming</option>}<option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></label></div>
        {filtered.length ? <AppointmentList appointments={filtered} busyId={busyId} onBrowse={onBrowse} onCancel={onCancel} onStatus={onStatus} onComplete={onComplete} role={role} /> : <EmptyState action={isPatient ? "Find a doctor" : undefined} detail={filter === "all" ? "Your appointments will appear here when they are created." : `There are no ${filter} appointments.`} icon={CalendarDays} onAction={onBrowse} title="No appointments to show" />}
      </section>
      <p className="timezone-note"><Clock3 size={14} /> Appointment times are displayed in UTC.</p>
    </div>
  );
}

function DoctorOverview({ appointments, onNavigate, onStatus, onComplete, busyId }) {
  const pending = appointments.filter((item) => item.status === "pending");
  const upcoming = appointments.filter((item) => appointmentDateTime(item) >= new Date() && ["pending", "approved"].includes(item.status));
  const completed = appointments.filter((item) => item.status === "completed");
  return (
    <div className="dashboard-stack">
      <section className="welcome-banner welcome-banner--doctor">
        <div className="welcome-banner__content"><span className="eyebrow eyebrow--light"><Activity size={14} /> Clinical workspace</span><h1>Your care, made clear.</h1><p>Review appointment requests and keep your patient schedule moving smoothly.</p><button className="button button--light" onClick={() => onNavigate("schedule")} type="button">Open schedule <ArrowRight size={16} /></button></div>
        <div className="welcome-banner__art" aria-hidden="true"><div className="welcome-art__ring welcome-art__ring--outer" /><div className="welcome-art__ring welcome-art__ring--inner" /><div className="welcome-art__heart"><Stethoscope size={43} strokeWidth={1.5} /></div><span className="welcome-art__spark welcome-art__spark--one">✦</span></div>
      </section>
      <div className="stat-grid">
        <StatCard icon={CalendarCheck} label="Upcoming visits" note="pending or approved" value={upcoming.length} />
        <StatCard icon={Clock3} label="Needs your review" note="appointment requests" tone="lavender" value={pending.length} />
        <StatCard icon={CheckCircle2} label="Completed visits" note="recorded in your schedule" tone="ivory" value={completed.length} />
      </div>
      <section className="surface-card">
        <SectionHeading action="Full schedule" onAction={() => onNavigate("schedule")} title="Requests to review" />
        {pending.length ? <AppointmentList appointments={pending.slice(0, 5)} busyId={busyId} onStatus={onStatus} onComplete={onComplete} role="doctor" /> : <EmptyState detail="There are no pending appointment requests." icon={CheckCircle2} title="You're all caught up" />}
      </section>
      <section className="surface-card">
        <SectionHeading action="View schedule" onAction={() => onNavigate("schedule")} title="Completed appointments" />
        {completed.length
          ? <AppointmentList appointments={completed.slice(0, 5)} busyId={busyId} onStatus={onStatus} onComplete={onComplete} role="doctor" />
          : <EmptyState detail="Completed visits will be recorded here." icon={CheckCircle2} title="No completed visits yet" />}
      </section>
    </div>
  );
}

function AdminOverview({ stats, appointments, analytics, onNavigate }) {
  const recent = appointments.slice().sort((a, b) => new Date(b.createdAt || b.appointmentDate) - new Date(a.createdAt || a.appointmentDate)).slice(0, 5);
  return (
    <div className="dashboard-stack">
      <section className="page-intro-row admin-intro"><div><span className="eyebrow">Clinic pulse · Live data</span><h1>Good morning, admin.</h1><p>Your clinic at a glance. Every number is drawn from your appointment records.</p></div><button className="button button--outline" onClick={() => onNavigate("people")} type="button"><Users size={16} /> Manage people</button></section>
      <div className="stat-grid">
        <StatCard icon={Users} label="Total patients" note="registered in your clinic" value={stats?.totalPatients ?? "—"} />
        <StatCard icon={Stethoscope} label="Active doctors" note={`${stats?.totalDoctors ?? "—"} total registered`} tone="lavender" value={stats?.activeDoctors ?? stats?.totalDoctors ?? "—"} />
        <StatCard icon={CalendarCheck} label="Total appointments" note="all statuses, all time" tone="ivory" value={stats?.totalAppointments ?? "—"} />
      </div>
      <div className="content-grid content-grid--admin">
        <section className="surface-card">
          <SectionHeading action="All appointments" onAction={() => onNavigate("appointments")} title="Recent activity" />
          {recent.length ? <AppointmentList appointments={recent} role="admin" /> : <EmptyState detail="Appointment activity will appear when patients book." icon={CalendarDays} title="No appointments recorded" />}
        </section>
        <AIAnalyticsCard analytics={analytics} onOpen={() => onNavigate("analytics")} />
      </div>
    </div>
  );
}

function AIAnalyticsCard({ analytics, onOpen }) {
  const statuses = analytics?.statusCounts || {};
  return (
    <section className="analytics-teaser">
      <div className="analytics-teaser__head"><span className="analytics-teaser__icon"><Sparkles size={18} /></span><span className="ai-tag">AI insights</span></div>
      <span className="eyebrow eyebrow--light">A clear view of care</span>
      <h2>Clinic activity, thoughtfully summarized.</h2>
      <p>{analytics?.summary || "Your real appointment trends will appear here."}</p>
      <div className="analytics-mini-bars">
        {["pending", "approved", "rejected", "cancelled", "completed"].map((status) => {
          const value = statuses[status] || 0;
          const total = analytics?.totalAppointments || 1;
          return <div className="analytics-mini-bars__item" key={status}><span>{statusLabel(status)}</span><div><i style={{ width: `${Math.min(100, (value / total) * 100)}%` }} /></div><strong>{value}</strong></div>;
        })}
      </div>
      <span className={`analytics-source${analytics?.aiAvailable ? "" : " analytics-source--fallback"}`}>{analytics?.aiAvailable ? "AI-generated from appointment aggregates" : "Data summary · AI unavailable"}</span>
      <button className="button button--light button--small" onClick={onOpen} type="button">Explore analytics <ArrowRight size={15} /></button>
    </section>
  );
}

function AnalyticsPage({ analytics }) {
  const daily = analytics?.dailyBookings || [];
  const byDate = new Map(daily.map((item) => [item.date, item.count]));
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);
    return { date: key, count: byDate.get(key) || 0 };
  });
  const maxDaily = Math.max(1, ...days.map((day) => day.count));
  const statuses = analytics?.statusCounts || {};
  const total = analytics?.totalAppointments || 0;
  return (
    <div className="dashboard-stack">
      <section className="page-intro-row"><div><span className="eyebrow">Real appointment aggregates</span><h1>Clinic insights</h1><p>AI-assisted summaries use appointment counts only—never patient names or appointment notes.</p></div><span className={`source-badge${analytics?.aiAvailable ? " source-badge--ai" : ""}`}>{analytics?.aiAvailable ? <><Sparkles size={14} /> AI-generated</> : <><Activity size={14} /> Data summary · AI offline</>}</span></section>
      <section className="analytics-summary-card"><span className="analytics-summary-card__icon"><Sparkles size={20} /></span><div><span className="eyebrow">{analytics?.aiAvailable ? "AI appointment summary" : "Appointment summary"}</span><p>{analytics?.summary || "Analytics are not available right now."}</p><small>Based on actual MongoDB appointment records.</small></div></section>
      <div className="stat-grid stat-grid--analytics">
        <StatCard icon={CalendarCheck} label="All appointments" note="all recorded statuses" value={total} />
        <StatCard icon={Clock3} label="Pending requests" note="awaiting doctor review" tone="lavender" value={statuses.pending || 0} />
        <StatCard icon={CheckCircle2} label="Approved visits" note="confirmed appointments" tone="ivory" value={statuses.approved || 0} />
      </div>
      <div className="content-grid content-grid--analytics">
        <section className="surface-card chart-card">
          <SectionHeading eyebrow="Last 7 days" title="Booking activity" />
          <div className="bar-chart" role="img" aria-label="Appointments booked per day over the last seven days">
            {days.map((day) => <div className="bar-chart__column" key={day.date}><span className="bar-chart__value">{day.count}</span><div className="bar-chart__track"><i style={{ height: `${Math.max(4, (day.count / maxDaily) * 100)}%` }} /></div><span className="bar-chart__label">{new Intl.DateTimeFormat("en", { weekday: "short", timeZone: "UTC" }).format(new Date(`${day.date}T12:00:00Z`))}</span></div>)}
          </div>
          <p className="chart-footnote">Bookings are grouped by appointment creation date.</p>
        </section>
        <section className="surface-card status-chart-card">
          <SectionHeading eyebrow="Appointment mix" title="By status" />
          <div className="status-breakdown">{["pending", "approved", "rejected", "cancelled", "completed"].map((status) => {
            const count = statuses[status] || 0;
            const percent = total ? (count / total) * 100 : 0;
            return <div className="status-breakdown__row" key={status}><div className={`status-breakdown__dot status-breakdown__dot--${status}`} /><span>{statusLabel(status)}</span><div><i style={{ width: `${percent}%` }} /></div><strong>{count}</strong></div>;
          })}</div>
          <div className="status-chart-card__total"><span>Total appointments</span><strong>{total}</strong></div>
          <p className="chart-footnote">Counts reflect the current appointment records.</p>
        </section>
      </div>
    </div>
  );
}

function DoctorAvailabilityPage({ availability, busy, onChange, onSave, onToggleDay }) {
  return (
    <div className="dashboard-stack">
      <section className="page-intro-row"><div><span className="eyebrow">Your working schedule</span><h1>Manage availability</h1><p>Patients can request appointments only during the hours and days you set here.</p></div></section>
      <form className="surface-card doctor-availability-form" onSubmit={onSave}>
        <fieldset className="availability-fieldset">
          <legend>Working days</legend>
          <div className="working-days">
            {WEEKDAYS.map(([day, label]) => <label key={day}><input checked={availability.workingDays.includes(day)} onChange={() => onToggleDay(day)} type="checkbox" /><span>{label}</span></label>)}
          </div>
        </fieldset>
        <div className="doctor-create-form__row">
          <label className="field"><span>Starting time (UTC)</span><input onChange={(event) => onChange("startTime", event.target.value)} required type="time" value={availability.startTime} /></label>
          <label className="field"><span>Ending time (UTC)</span><input onChange={(event) => onChange("endTime", event.target.value)} required type="time" value={availability.endTime} /></label>
          <label className="field"><span>Appointment duration (minutes)</span><input max="240" min="5" onChange={(event) => onChange("appointmentDurationMinutes", event.target.value)} required step="5" type="number" value={availability.appointmentDurationMinutes} /></label>
        </div>
        <p className="field-hint">Only complete appointment slots that fit within these hours are offered to patients. Times are stored in UTC.</p>
        <div className="modal__footer"><button className="button button--primary" disabled={busy} type="submit">{busy ? <span className="spinner" /> : <><Check size={16} /> Save availability</>}</button></div>
      </form>
    </div>
  );
}

function PeoplePage({ users, filter, onFilter, onCreate, onEdit, onStatus, onDelete, busyId }) {
  const [search, setSearch] = useState("");
  const filtered = users.filter((account) => (filter === "all" || account.role === filter) && `${account.name} ${account.email} ${account.specialization || ""}`.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="dashboard-stack">
      <section className="page-intro-row"><div><span className="eyebrow">Your clinic community</span><h1>People</h1><p>Manage patient and doctor accounts connected to your clinic.</p></div><button className="button button--primary" onClick={onCreate} type="button"><UserPlus size={16} /> Add a doctor</button></section>
      <section className="surface-card people-card">
        <div className="people-toolbar"><label className="search-field"><Search size={17} /><input aria-label="Search people" onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email or specialty" value={search} /></label><label className="select-field select-field--compact"><SlidersHorizontal size={15} /><select aria-label="Filter people by role" onChange={(event) => onFilter(event.target.value)} value={filter}><option value="all">All people</option><option value="doctor">Doctors</option><option value="patient">Patients</option></select></label></div>
        <div className="table-scroll"><table className="data-table"><thead><tr><th>Person</th><th>Role</th><th>Specialty</th><th>Status</th><th className="table-actions">Manage</th></tr></thead><tbody>
          {filtered.map((account) => <tr key={account._id}>
            <td><div className="table-person"><Avatar name={account.name} tone={account.role === "doctor" ? "mint" : "lavender"} small /><div><strong>{account.name}</strong><span>{account.email}</span></div></div></td>
            <td><RoleLabel role={account.role} /></td>
            <td>{account.specialization || "—"}{account.role === "doctor" && <small className="table-subtext">{account.experience ?? 0} years experience</small>}</td>
            <td><span className={`account-status${account.isActive === false ? " account-status--inactive" : ""}`}><i />{account.isActive === false ? "Inactive" : "Active"}</span></td>
            <td><div className="table-actions__buttons">{account.role === "doctor" && <button className="quiet-button" disabled={busyId === account._id} onClick={() => onEdit(account)} type="button">Edit</button>}<button className="quiet-button" disabled={busyId === account._id} onClick={() => onStatus(account, account.isActive === false)} type="button">{account.isActive === false ? "Activate" : "Deactivate"}</button><button aria-label={`Delete ${account.name}`} className="icon-button icon-button--danger" disabled={busyId === account._id} onClick={() => onDelete(account)} title="Delete account" type="button"><X size={15} /></button></div></td>
          </tr>)}
        </tbody></table></div>
        {!filtered.length && <EmptyState detail={users.length ? "Try a different search or filter." : "Patients and doctors will appear as they join your clinic."} icon={Users} title={users.length ? "No matching people" : "Your directory is empty"} />}
        <div className="table-foot"><span>Showing {filtered.length} of {users.length} accounts</span><span><ShieldCheck size={14} /> Admin-only access</span></div>
      </section>
    </div>
  );
}
