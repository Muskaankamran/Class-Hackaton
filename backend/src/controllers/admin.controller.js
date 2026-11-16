import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import appointmentModel from "../models/appointments.model.js";
import userModel from "../models/users.model.js";
import { hasScheduleConflict, normalizeAvailability } from "../utils/doctor-availability.js";

function isProfileImageUrl(value) {
  if (value === undefined || value === null || value === "") return true;
  if (typeof value !== "string" || value.length > 2048) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

async function getUsers(req, res) {
  const users = await userModel.find({ role: { $in: ["patient", "doctor"] } })
    .select("name email role isActive specialization qualification experience consultationFee profileImage availability")
    .sort({ role: 1, name: 1 });
  return res.status(200).json({ users });
}

async function createDoctor(req, res) {
  const {
    name,
    email,
    password,
    specialization,
    qualification = "",
    experience,
    consultationFee,
    profileImage = "",
    availability,
  } = req.body ?? {};
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const years = experience === "" || experience === undefined ? NaN : Number(experience);
  const fee = consultationFee === "" || consultationFee === undefined ? NaN : Number(consultationFee);
  const normalizedAvailability = availability === undefined ? undefined : normalizeAvailability(availability);
  if (typeof name !== "string" || !name.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ||
      typeof password !== "string" || password.length < 8 ||
      typeof specialization !== "string" || !specialization.trim() ||
      !Number.isFinite(years) || years < 0 ||
      typeof qualification !== "string" || qualification.trim().length > 160 ||
      (consultationFee !== undefined && consultationFee !== "" && (!Number.isFinite(fee) || fee < 0)) ||
      !isProfileImageUrl(profileImage) ||
      (availability !== undefined && !normalizedAvailability)) {
    return res.status(400).json({
      message: "Provide valid doctor details, a password of at least 8 characters, and valid optional profile and availability fields",
    });
  }
  if (await userModel.exists({ $or: [{ email: normalizedEmail }, { username: normalizedEmail }] })) {
    return res.status(409).json({ message: "A user with this email already exists" });
  }

  const doctorData = {
    name: name.trim(),
    username: normalizedEmail,
    email: normalizedEmail,
    password: await bcrypt.hash(password, 10),
    role: "doctor",
    specialization: specialization.trim(),
    experience: years,
    qualification: qualification.trim(),
    isActive: true,
  };
  if (Number.isFinite(fee)) doctorData.consultationFee = fee;
  if (profileImage) doctorData.profileImage = profileImage.trim();
  if (normalizedAvailability) doctorData.availability = normalizedAvailability;

  const doctor = await userModel.create(doctorData);
  const result = doctor.toObject();
  delete result.password;
  return res.status(201).json({ message: "Doctor created successfully", doctor: result });
}

async function updateDoctor(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid doctor ID" });
  }
  const body = req.body ?? {};
  const updates = {};
  if (body.name !== undefined) {
    if (typeof body.name !== "string" || !body.name.trim()) {
      return res.status(400).json({ message: "Doctor name is required" });
    }
    updates.name = body.name.trim();
  }
  if (body.email !== undefined) {
    if (typeof body.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) {
      return res.status(400).json({ message: "A valid email is required" });
    }
    const email = body.email.trim().toLowerCase();
    const duplicate = await userModel.exists({
      _id: { $ne: req.params.id },
      $or: [{ email }, { username: email }],
    });
    if (duplicate) {
      return res.status(409).json({ message: "A user with this email already exists" });
    }
    updates.email = email;
    updates.username = email;
  }
  if (body.specialization !== undefined) {
    if (typeof body.specialization !== "string" || !body.specialization.trim()) {
      return res.status(400).json({ message: "Specialization is required" });
    }
    updates.specialization = body.specialization.trim();
  }
  if (body.qualification !== undefined) {
    if (typeof body.qualification !== "string" || body.qualification.trim().length > 160) {
      return res.status(400).json({ message: "Qualification must be 160 characters or fewer" });
    }
    updates.qualification = body.qualification.trim();
  }
  if (body.experience !== undefined) {
    const experience = Number(body.experience);
    if (!Number.isFinite(experience) || experience < 0) {
      return res.status(400).json({ message: "Experience must be a non-negative number" });
    }
    updates.experience = experience;
  }
  if (body.consultationFee !== undefined) {
    const fee = Number(body.consultationFee);
    if (!Number.isFinite(fee) || fee < 0) {
      return res.status(400).json({ message: "Consultation fee must be a non-negative number" });
    }
    updates.consultationFee = fee;
  }
  if (body.profileImage !== undefined) {
    if (!isProfileImageUrl(body.profileImage)) {
      return res.status(400).json({ message: "Profile image must be an HTTP(S) URL" });
    }
    updates.profileImage = typeof body.profileImage === "string" ? body.profileImage.trim() : "";
  }
  if (body.availability !== undefined) {
    const availability = normalizeAvailability(body.availability);
    if (!availability) {
      return res.status(400).json({ message: "Provide valid working days, hours, and appointment duration" });
    }
    const futureAppointments = await appointmentModel.find({
      doctor: req.params.id,
      status: { $in: ["pending", "approved"] },
    }).select("appointmentDate appointmentTime -_id");
    if (hasScheduleConflict(futureAppointments, availability)) {
      return res.status(409).json({
        message: "Availability cannot be changed while pending or approved appointments fall outside the new schedule",
      });
    }
    updates.availability = availability;
  }
  if (!Object.keys(updates).length) {
    return res.status(400).json({ message: "At least one doctor field must be provided" });
  }
  const doctor = await userModel.findOneAndUpdate(
    { _id: req.params.id, role: "doctor" },
    { $set: updates },
    { returnDocument: "after", runValidators: true },
  ).select("-password");
  if (!doctor) {
    return res.status(404).json({ message: "Doctor not found" });
  }
  return res.status(200).json({ message: "Doctor updated successfully", doctor });
}

async function deleteUser(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }
  const user = await userModel.findById(req.params.id);
  if (!user || !["doctor", "patient"].includes(user.role)) {
    return res.status(404).json({ message: "Patient or doctor not found" });
  }
  await userModel.deleteOne({ _id: user._id });
  return res.status(200).json({ message: "User deleted successfully" });
}

async function updateUserStatus(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }
  if (typeof req.body?.isActive !== "boolean") {
    return res.status(400).json({ message: "isActive must be a boolean" });
  }
  const user = await userModel.findOneAndUpdate(
    { _id: req.params.id, role: { $in: ["doctor", "patient"] } },
    { $set: { isActive: req.body.isActive } },
    { returnDocument: "after", runValidators: true },
  ).select("-password");
  if (!user) {
    return res.status(404).json({ message: "Patient or doctor not found" });
  }
  return res.status(200).json({ message: "User status updated", user });
}

async function getAllAppointments(req, res) {
  const { status } = req.query;
  const allowedStatuses = ["pending", "approved", "rejected", "cancelled", "completed"];
  if (status !== undefined && !allowedStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid appointment status filter" });
  }
  const appointments = await appointmentModel.find(status ? { status } : {})
    .populate([
      { path: "patient", select: "name email" },
      { path: "doctor", select: "name email specialization qualification experience consultationFee profileImage availability" },
    ])
    .sort({ appointmentDate: 1, appointmentTime: 1 });
  return res.status(200).json({ appointments });
}

async function getStats(req, res) {
  const [totalPatients, totalDoctors, activeDoctors, totalAppointments] = await Promise.all([
    userModel.countDocuments({ role: "patient" }),
    userModel.countDocuments({ role: "doctor" }),
    userModel.countDocuments({ role: "doctor", isActive: true }),
    appointmentModel.countDocuments(),
  ]);
  return res.status(200).json({ totalPatients, totalDoctors, activeDoctors, totalAppointments });
}

export {
  getUsers,
  createDoctor,
  updateDoctor,
  deleteUser,
  updateUserStatus,
  getAllAppointments,
  getStats,
};
