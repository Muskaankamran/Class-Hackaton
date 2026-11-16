export const WEEKDAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function toMinutes(value) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function normalizeAvailability(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const workingDays = Array.isArray(value.workingDays)
    ? [...new Set(value.workingDays.map((day) => typeof day === "string" ? day.toLowerCase() : ""))]
    : [];
  const duration = Number(value.appointmentDurationMinutes);
  if (!workingDays.length ||
      workingDays.some((day) => !WEEKDAYS.includes(day)) ||
      !TIME_PATTERN.test(value.startTime) ||
      !TIME_PATTERN.test(value.endTime) ||
      toMinutes(value.endTime) <= toMinutes(value.startTime) ||
      !Number.isInteger(duration) || duration < 5 || duration > 240) {
    return null;
  }
  return {
    workingDays,
    startTime: value.startTime,
    endTime: value.endTime,
    appointmentDurationMinutes: duration,
  };
}

export function scheduledSlotsFor(availability, date) {
  if (!availability?.workingDays?.length || !TIME_PATTERN.test(availability.startTime || "") ||
      !TIME_PATTERN.test(availability.endTime || "") ||
      !Number.isInteger(availability.appointmentDurationMinutes) ||
      availability.appointmentDurationMinutes < 5 ||
      availability.appointmentDurationMinutes > 240 ||
      toMinutes(availability.endTime) <= toMinutes(availability.startTime)) {
    return [];
  }
  const dateValue = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(dateValue.getTime()) || dateValue.toISOString().slice(0, 10) !== date) {
    return [];
  }
  const weekday = WEEKDAYS[dateValue.getUTCDay()];
  if (!availability.workingDays.includes(weekday)) {
    return [];
  }

  const slots = [];
  const end = toMinutes(availability.endTime);
  for (let minute = toMinutes(availability.startTime);
    minute + availability.appointmentDurationMinutes <= end;
    minute += availability.appointmentDurationMinutes) {
    const time = `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
    slots.push(time);
  }
  return slots;
}

export function availableSlotsFor(availability, date, now = new Date()) {
  return scheduledSlotsFor(availability, date)
    .filter((time) => new Date(`${date}T${time}:00.000Z`) > now);
}

export function hasScheduleConflict(appointments, availability, now = new Date()) {
  return appointments.some((appointment) => {
    const date = appointment.appointmentDate.toISOString().slice(0, 10);
    const dateTime = new Date(`${date}T${appointment.appointmentTime}:00.000Z`);
    return dateTime > now && !scheduledSlotsFor(availability, date).includes(appointment.appointmentTime);
  });
}
