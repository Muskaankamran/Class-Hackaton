import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import appointmentModel from "../models/appointments.model.js";
import userModel from "../models/users.model.js";

async function getUsers(req, res) {
  const users = await userModel.find({ role: { $in: ["patient", "doctor"] } })
    .select("-password")
    .sort({ role: 1, name: 1 });
  return res.status(200).json({ users });
}

async function createDoctor(req, res) {
  const { name, email, password, specialization, experience } = req.body ?? {};
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const years = experience === "" || experience === undefined ? NaN : Number(experience);
  if (typeof name !== "string" || !name.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ||
      typeof password !== "string" || password.length < 8 ||
      typeof specialization !== "string" || !specialization.trim() ||
      !Number.isFinite(years) || years < 0) {
    return res.status(400).json({
      message: "Name, valid email, password of at least 8 characters, specialization, and non-negative experience are required",
    });
  }
  if (await userModel.exists({ email: normalizedEmail })) {
    return res.status(409).json({ message: "A user with this email already exists" });
  }

  const doctor = await userModel.create({
    name: name.trim(),
    username: normalizedEmail,
    email: normalizedEmail,
    password: await bcrypt.hash(password, 10),
    role: "doctor",
    specialization: specialization.trim(),
    experience: years,
  });
  const doctorData = doctor.toObject();
  delete doctorData.password;
  return res.status(201).json({ message: "Doctor created successfully", doctor: doctorData });
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
  const appointments = await appointmentModel.find()
    .populate([
      { path: "patient", select: "name email" },
      { path: "doctor", select: "name email specialization experience" },
    ])
    .sort({ appointmentDate: 1, appointmentTime: 1 });
  return res.status(200).json({ appointments });
}

async function getStats(req, res) {
  const [totalPatients, totalDoctors, totalAppointments] = await Promise.all([
    userModel.countDocuments({ role: "patient" }),
    userModel.countDocuments({ role: "doctor" }),
    appointmentModel.countDocuments(),
  ]);
  return res.status(200).json({ totalPatients, totalDoctors, totalAppointments });
}

export {
  getUsers,
  createDoctor,
  deleteUser,
  updateUserStatus,
  getAllAppointments,
  getStats,
};
