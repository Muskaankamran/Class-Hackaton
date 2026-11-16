import mongoose from "mongoose";
import appointmentModel from "../models/appointments.model.js";
import userModel from "../models/users.model.js";

const appointmentDetails = [
  { path: "patient", select: "name email" },
  { path: "doctor", select: "name specialization experience" },
];

function isValidAppointmentDate(date, time) {
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      typeof time !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    return false;
  }
  const dateValue = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(dateValue.getTime()) || dateValue.toISOString().slice(0, 10) !== date) {
    return false;
  }
  return new Date(`${date}T${time}:00.000Z`) > new Date();
}

async function bookAppointment(req, res) {
  const { doctor: doctorId, appointmentDate, appointmentTime, reason } = req.body ?? {};
  if (!mongoose.isValidObjectId(doctorId)) {
    return res.status(400).json({ message: "A valid doctor ID is required" });
  }
  if (!isValidAppointmentDate(appointmentDate, appointmentTime)) {
    return res.status(400).json({ message: "A valid future appointment date and time are required" });
  }
  if (typeof reason !== "string" || !reason.trim() || reason.trim().length > 1000) {
    return res.status(400).json({ message: "Reason is required and must be 1000 characters or fewer" });
  }

  const doctor = await userModel.findOne({
    _id: doctorId,
    role: "doctor",
    isActive: true,
  }).select("_id");
  if (!doctor) {
    return res.status(404).json({ message: "Active doctor not found" });
  }

  const normalizedDate = new Date(`${appointmentDate}T00:00:00.000Z`);
  const existingAppointment = await appointmentModel.findOne({
    doctor: doctorId,
    appointmentDate: normalizedDate,
    appointmentTime,
    status: { $in: ["pending", "approved"] },
  }).select("_id");
  if (existingAppointment) {
    return res.status(409).json({ message: "This doctor already has an appointment at that date and time" });
  }

  const appointment = await appointmentModel.create({
    patient: req.user.id,
    doctor: doctorId,
    appointmentDate: normalizedDate,
    appointmentTime,
    reason: reason.trim(),
    slotKey: `${doctorId}:${appointmentDate}:${appointmentTime}`,
  });
  await appointment.populate(appointmentDetails);
  return res.status(201).json({ message: "Appointment booked successfully", appointment });
}

async function getMyAppointments(req, res) {
  const appointments = await appointmentModel.find({ patient: req.user.id })
    .populate(appointmentDetails)
    .sort({ appointmentDate: 1, appointmentTime: 1 });
  return res.status(200).json({ appointments });
}

async function getDoctorAppointments(req, res) {
  const appointments = await appointmentModel.find({ doctor: req.user.id })
    .populate(appointmentDetails)
    .sort({ appointmentDate: 1, appointmentTime: 1 });
  return res.status(200).json({ appointments });
}

async function updateAppointmentStatus(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid appointment ID" });
  }
  const { status } = req.body ?? {};
  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ message: "Status must be approved or rejected" });
  }
  const update = { $set: { status } };
  if (status === "rejected") {
    update.$unset = { slotKey: 1 };
  }
  const appointment = await appointmentModel.findOneAndUpdate(
    { _id: req.params.id, doctor: req.user.id, status: "pending" },
    update,
    { returnDocument: "after", runValidators: true },
  ).populate(appointmentDetails);
  if (!appointment) {
    return res.status(404).json({ message: "Pending appointment not found for this doctor" });
  }
  return res.status(200).json({ message: `Appointment ${status}`, appointment });
}

async function cancelAppointment(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid appointment ID" });
  }
  const appointment = await appointmentModel.findOneAndUpdate(
    { _id: req.params.id, patient: req.user.id, status: "pending" },
    { $set: { status: "cancelled" }, $unset: { slotKey: 1 } },
    { returnDocument: "after", runValidators: true },
  ).populate(appointmentDetails);
  if (!appointment) {
    return res.status(404).json({ message: "Pending appointment not found for this patient" });
  }
  return res.status(200).json({ message: "Appointment cancelled", appointment });
}

export {
  bookAppointment,
  getMyAppointments,
  getDoctorAppointments,
  updateAppointmentStatus,
  cancelAppointment,
};
