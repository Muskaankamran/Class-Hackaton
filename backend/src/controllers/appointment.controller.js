import Appointment from "../models/appointment.model.js";
import User from "../models/users.model.js";

// Helper: Normalize date to start of day for comparison
const toDateOnly = (dateStr) => {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return d;
};

// POST /api/appointments (Patient)
export async function bookAppointment(req, res) {
  try {
    const { doctorId, doctor, appointmentDate, appointmentTime, reason } = req.body;
    const assignedDoctorId = doctorId || doctor;

    if (!assignedDoctorId || !appointmentDate || !appointmentTime || !reason) {
      return res.status(400).json({
        message: "Doctor, appointment date, time, and reason are required",
      });
    }

    // Check doctor exists and is an active doctor
    const doctorObj = await User.findOne({
      _id: assignedDoctorId,
      role: "doctor",
      isActive: true,
    });

    if (!doctorObj) {
      return res.status(404).json({ message: "Selected doctor was not found or is inactive" });
    }

    // Bonus Rule: Prevent booking appointments in the past
    const appDate = toDateOnly(appointmentDate);
    const today = toDateOnly(new Date());

    if (appDate < today) {
      return res.status(400).json({
        message: "Cannot book an appointment for a past date",
      });
    }

    // Business Rule 8: A patient cannot book two appointments with the same doctor at the same date and time
    const startOfDay = new Date(appDate);
    const endOfDay = new Date(appDate);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const duplicatePatientBooking = await Appointment.findOne({
      patient: req.user._id,
      doctor: assignedDoctorId,
      appointmentDate: { $gte: startOfDay, $lt: endOfDay },
      appointmentTime: appointmentTime.trim(),
      status: { $in: ["pending", "approved"] },
    });

    if (duplicatePatientBooking) {
      return res.status(409).json({
        message: "You already have an appointment with this doctor at the selected date and time",
      });
    }

    // Bonus Rule: Prevent double booking of an approved appointment for this doctor
    const doctorDoubleBooking = await Appointment.findOne({
      doctor: assignedDoctorId,
      appointmentDate: { $gte: startOfDay, $lt: endOfDay },
      appointmentTime: appointmentTime.trim(),
      status: "approved",
    });

    if (doctorDoubleBooking) {
      return res.status(409).json({
        message: "This doctor is already booked and approved for the selected time slot. Please choose another time.",
      });
    }

    const appointment = await Appointment.create({
      patient: req.user._id,
      doctor: assignedDoctorId,
      appointmentDate: appDate,
      appointmentTime: appointmentTime.trim(),
      reason: reason.trim(),
      status: "pending",
    });

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate("patient", "name email isActive")
      .populate("doctor", "name email specialization experience avatar");

    return res.status(201).json({
      message: "Appointment booked successfully",
      appointment: populatedAppointment,
    });
  } catch (error) {
    console.error("Book Appointment Error:", error);
    return res.status(500).json({ message: "Failed to book appointment", error: error.message });
  }
}

// GET /api/appointments/my (Patient - view their own appointments)
export async function getMyAppointments(req, res) {
  try {
    const { status } = req.query;
    const query = { patient: req.user._id };

    if (status && ["pending", "approved", "rejected", "cancelled"].includes(status)) {
      query.status = status;
    }

    const appointments = await Appointment.find(query)
      .populate("doctor", "name email specialization experience avatar")
      .sort({ appointmentDate: -1, createdAt: -1 });

    return res.status(200).json({ appointments });
  } catch (error) {
    console.error("Get My Appointments Error:", error);
    return res.status(500).json({ message: "Failed to fetch your appointments", error: error.message });
  }
}

// GET /api/appointments/doctor (Doctor - view appointment requests assigned to them)
export async function getDoctorAppointments(req, res) {
  try {
    const { status } = req.query;
    const query = { doctor: req.user._id };

    if (status && ["pending", "approved", "rejected", "cancelled"].includes(status)) {
      query.status = status;
    }

    const appointments = await Appointment.find(query)
      .populate("patient", "name email isActive")
      .sort({ appointmentDate: 1, createdAt: -1 });

    const total = await Appointment.countDocuments({ doctor: req.user._id });
    const pending = await Appointment.countDocuments({ doctor: req.user._id, status: "pending" });
    const approved = await Appointment.countDocuments({ doctor: req.user._id, status: "approved" });
    const rejected = await Appointment.countDocuments({ doctor: req.user._id, status: "rejected" });

    return res.status(200).json({
      appointments,
      counts: {
        total,
        pending,
        approved,
        rejected,
      },
    });
  } catch (error) {
    console.error("Get Doctor Appointments Error:", error);
    return res.status(500).json({ message: "Failed to fetch doctor appointments", error: error.message });
  }
}

// PATCH /api/appointments/:id/status (Doctor - approve or reject)
export async function updateAppointmentStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Status must be 'approved' or 'rejected'" });
    }

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Business Rule 3 & 4: Only doctors can approve or reject, and must not approve/reject another doctor's appointment (unless Admin)
    if (req.user.role !== "admin" && appointment.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Forbidden: You are not authorized to update another doctor's appointment",
      });
    }

    // Bonus check: If approving, make sure another appointment is not already approved for this time slot
    if (status === "approved") {
      const appDate = toDateOnly(appointment.appointmentDate);
      const startOfDay = new Date(appDate);
      const endOfDay = new Date(appDate);
      endOfDay.setDate(endOfDay.getDate() + 1);

      const conflict = await Appointment.findOne({
        _id: { $ne: appointment._id },
        doctor: req.user._id,
        appointmentDate: { $gte: startOfDay, $lt: endOfDay },
        appointmentTime: appointment.appointmentTime,
        status: "approved",
      });

      if (conflict) {
        return res.status(409).json({
          message: "Conflict: You already have another approved appointment at this date and time",
        });
      }
    }

    appointment.status = status;
    await appointment.save();

    const updated = await Appointment.findById(appointment._id)
      .populate("patient", "name email isActive")
      .populate("doctor", "name email specialization experience avatar");

    return res.status(200).json({
      message: `Appointment ${status} successfully`,
      appointment: updated,
    });
  } catch (error) {
    console.error("Update Status Error:", error);
    return res.status(500).json({ message: "Failed to update appointment status", error: error.message });
  }
}

// PATCH /api/appointments/:id/cancel (Patient - cancel pending appointment)
export async function cancelAppointment(req, res) {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Business Rule 5: Patients can manage only their own appointments (unless Admin)
    if (req.user.role !== "admin" && appointment.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Forbidden: You can only cancel your own appointments",
      });
    }

    // Business Rule 6: Patients can cancel only appointments that are still pending (Admin can cancel anytime)
    if (req.user.role !== "admin" && appointment.status !== "pending") {
      return res.status(400).json({
        message: `Cannot cancel an appointment that is already ${appointment.status}. Only pending appointments can be cancelled.`,
      });
    }

    appointment.status = "cancelled";
    await appointment.save();

    const updated = await Appointment.findById(appointment._id)
      .populate("doctor", "name email specialization experience avatar");

    return res.status(200).json({
      message: "Appointment cancelled successfully",
      appointment: updated,
    });
  } catch (error) {
    console.error("Cancel Appointment Error:", error);
    return res.status(500).json({ message: "Failed to cancel appointment", error: error.message });
  }
}
