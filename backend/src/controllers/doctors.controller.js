import mongoose from "mongoose";
import appointmentModel from "../models/appointments.model.js";
import userModel from "../models/users.model.js";
import { hasScheduleConflict, normalizeAvailability } from "../utils/doctor-availability.js";

async function getDoctors(req, res) {
  const { search, specialization } = req.query;
  const filters = { role: "doctor", isActive: true };
  if (typeof search === "string" && search.trim()) {
    const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filters.name = { $regex: escapedSearch, $options: "i" };
  }
  if (typeof specialization === "string" && specialization.trim()) {
    filters.specialization = specialization.trim();
  }
  const doctors = await userModel.find(filters)
    .select("name specialization qualification experience consultationFee profileImage availability isActive")
    .sort({ name: 1 });
  return res.status(200).json({ doctors });
}

async function getDoctorById(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid doctor ID" });
  }
  const doctor = await userModel.findOne({
    _id: req.params.id,
    role: "doctor",
    isActive: true,
  }).select("name specialization qualification experience consultationFee profileImage availability isActive");
  if (!doctor) {
    return res.status(404).json({ message: "Doctor not found" });
  }
  return res.status(200).json({ doctor });
}

async function updateMyAvailability(req, res) {
  const availability = normalizeAvailability(req.body);
  if (!availability) {
    return res.status(400).json({
      message: "Choose at least one working day and provide valid working hours and appointment duration",
    });
  }
  const futureAppointments = await appointmentModel.find({
    doctor: req.user.id,
    status: { $in: ["pending", "approved"] },
  }).select("appointmentDate appointmentTime -_id");
  if (hasScheduleConflict(futureAppointments, availability)) {
    return res.status(409).json({
      message: "Availability cannot be changed while pending or approved appointments fall outside the new schedule",
    });
  }
  const doctor = await userModel.findOneAndUpdate(
    { _id: req.user.id, role: "doctor", isActive: true },
    { $set: { availability } },
    { returnDocument: "after", runValidators: true },
  ).select("name specialization qualification experience consultationFee profileImage availability isActive");
  if (!doctor) {
    return res.status(404).json({ message: "Active doctor account not found" });
  }
  return res.status(200).json({ message: "Availability updated", doctor });
}

export { getDoctors, getDoctorById, updateMyAvailability };
