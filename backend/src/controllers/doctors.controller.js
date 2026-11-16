import mongoose from "mongoose";
import userModel from "../models/users.model.js";

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
    .select("name specialization experience")
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
  }).select("name specialization experience");
  if (!doctor) {
    return res.status(404).json({ message: "Doctor not found" });
  }
  return res.status(200).json({ doctor });
}

export { getDoctors, getDoctorById };
