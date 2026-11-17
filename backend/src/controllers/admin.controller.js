import bcrypt from "bcryptjs";
import User from "../models/users.model.js";
import Appointment from "../models/appointment.model.js";
import DoctorAvailability from "../models/availability.model.js";

// GET /api/admin/stats
export async function getAdminStats(req, res) {
  try {
    const totalPatients = await User.countDocuments({ role: "patient" });
    const totalDoctors = await User.countDocuments({ role: "doctor" });
    const totalUsers = await User.countDocuments();
    const totalAppointments = await Appointment.countDocuments();
    const pendingAppointments = await Appointment.countDocuments({ status: "pending" });
    const approvedAppointments = await Appointment.countDocuments({ status: "approved" });
    const rejectedAppointments = await Appointment.countDocuments({ status: "rejected" });
    const cancelledAppointments = await Appointment.countDocuments({ status: "cancelled" });

    return res.status(200).json({
      stats: {
        totalPatients,
        totalDoctors,
        totalUsers,
        totalAppointments,
        pendingAppointments,
        approvedAppointments,
        rejectedAppointments,
        cancelledAppointments,
      },
    });
  } catch (error) {
    console.error("Admin Stats Error:", error);
    return res.status(500).json({ message: "Failed to fetch stats", error: error.message });
  }
}

// GET /api/admin/users
export async function getAllUsers(req, res) {
  try {
    const { role, search } = req.query;
    const query = {};

    if (role && ["admin", "doctor", "patient"].includes(role)) {
      query.role = role;
    }

    if (search && search.trim() !== "") {
      const searchRegex = { $regex: search.trim(), $options: "i" };
      query.$or = [{ name: searchRegex }, { email: searchRegex }, { specialization: searchRegex }];
    }

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({ users });
  } catch (error) {
    console.error("Admin Get Users Error:", error);
    return res.status(500).json({ message: "Failed to fetch users", error: error.message });
  }
}

// POST /api/admin/doctors
export async function addDoctor(req, res) {
  try {
    const { name, email, password, specialization, experience, avatar } = req.body;

    if (!name || !email || !password || !specialization) {
      return res.status(400).json({
        message: "Doctor name, email, password, and specialization are required",
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: "A user with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const doctor = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: "doctor",
      specialization: specialization.trim(),
      experience: Number(experience) || 0,
      avatar: avatar || "",
      isActive: true,
    });

    // Create default availability for new doctor
    await DoctorAvailability.create({
      doctor: doctor._id,
      availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      startTime: "09:00",
      endTime: "17:00",
    });

    const safeDoctor = doctor.toObject();
    delete safeDoctor.password;

    return res.status(201).json({
      message: "Doctor account created successfully",
      doctor: safeDoctor,
    });
  } catch (error) {
    console.error("Admin Add Doctor Error:", error);
    return res.status(500).json({ message: "Failed to create doctor account", error: error.message });
  }
}

// DELETE /api/admin/users/:id
export async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    if (id === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot delete your own admin account" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(400).json({ message: "Cannot delete another admin account" });
    }

    // Clean up related appointments & availability
    if (user.role === "doctor") {
      await DoctorAvailability.deleteMany({ doctor: user._id });
      await Appointment.deleteMany({ doctor: user._id });
    } else if (user.role === "patient") {
      await Appointment.deleteMany({ patient: user._id });
    }

    await User.findByIdAndDelete(id);

    return res.status(200).json({
      message: `${user.role === "doctor" ? "Doctor" : "Patient"} user deleted successfully`,
    });
  } catch (error) {
    console.error("Admin Delete User Error:", error);
    return res.status(500).json({ message: "Failed to delete user", error: error.message });
  }
}

// PATCH /api/admin/users/:id/status (activate / deactivate)
export async function toggleUserStatus(req, res) {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (id === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot deactivate your own admin account" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // If isActive boolean is explicitly provided, use it; otherwise toggle
    user.isActive = typeof isActive === "boolean" ? isActive : !user.isActive;
    await user.save();

    const safeUser = user.toObject();
    delete safeUser.password;

    return res.status(200).json({
      message: `User account ${user.isActive ? "activated" : "deactivated"} successfully`,
      user: safeUser,
    });
  } catch (error) {
    console.error("Admin Toggle Status Error:", error);
    return res.status(500).json({ message: "Failed to update user status", error: error.message });
  }
}

// GET /api/admin/appointments
export async function getAllAppointments(req, res) {
  try {
    const { status, doctorId, patientId, search } = req.query;
    const query = {};

    if (status && ["pending", "approved", "rejected", "cancelled"].includes(status)) {
      query.status = status;
    }

    if (doctorId) {
      query.doctor = doctorId;
    }

    if (patientId) {
      query.patient = patientId;
    }

    const appointments = await Appointment.find(query)
      .populate("patient", "name email isActive")
      .populate("doctor", "name email specialization experience avatar")
      .sort({ appointmentDate: -1, createdAt: -1 });

    // Bonus: Search appointments by patient name if search query is provided
    let filteredAppointments = appointments;
    if (search && search.trim() !== "") {
      const term = search.toLowerCase().trim();
      filteredAppointments = appointments.filter(
        (a) =>
          a.patient?.name?.toLowerCase().includes(term) ||
          a.doctor?.name?.toLowerCase().includes(term) ||
          a.reason?.toLowerCase().includes(term)
      );
    }

    return res.status(200).json({ appointments: filteredAppointments });
  } catch (error) {
    console.error("Admin Get Appointments Error:", error);
    return res.status(500).json({ message: "Failed to fetch appointments", error: error.message });
  }
}

// PATCH /api/admin/appointments/:id/status (Admin approve, cancel, or reject any appointment)
export async function updateAppointmentStatusByAdmin(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["approved", "rejected", "cancelled", "pending"].includes(status)) {
      return res.status(400).json({
        message: "Status must be 'approved', 'rejected', 'cancelled', or 'pending'",
      });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    appointment.status = status;
    await appointment.save();

    const updated = await Appointment.findById(appointment._id)
      .populate("patient", "name email isActive")
      .populate("doctor", "name email specialization experience avatar");

    return res.status(200).json({
      message: `Appointment marked as ${status} successfully by Administrator`,
      appointment: updated,
    });
  } catch (error) {
    console.error("Admin Update Appointment Status Error:", error);
    return res.status(500).json({
      message: "Failed to update appointment status",
      error: error.message,
    });
  }
}
