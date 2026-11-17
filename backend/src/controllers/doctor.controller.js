import User from "../models/users.model.js";
import DoctorAvailability from "../models/availability.model.js";

// GET /api/doctors
export async function getAllDoctors(req, res) {
  try {
    const { search, specialization } = req.query;

    const query = {
      role: "doctor",
      isActive: true,
    };

    if (specialization && specialization.trim() !== "" && specialization !== "all") {
      query.specialization = { $regex: new RegExp(`^${specialization.trim()}$`, "i") };
    }

    if (search && search.trim() !== "") {
      const searchRegex = { $regex: search.trim(), $options: "i" };
      query.$or = [{ name: searchRegex }, { specialization: searchRegex }];
    }

    const doctors = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({ doctors });
  } catch (error) {
    console.error("Get Doctors Error:", error);
    return res.status(500).json({ message: "Failed to fetch doctors", error: error.message });
  }
}

// GET /api/doctors/:id
export async function getDoctorById(req, res) {
  try {
    const { id } = req.params;

    const doctor = await User.findOne({ _id: id, role: "doctor" }).select("-password");

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const availability = await DoctorAvailability.findOne({ doctor: doctor._id });

    return res.status(200).json({
      doctor,
      availability: availability || {
        availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        startTime: "09:00",
        endTime: "17:00",
      },
    });
  } catch (error) {
    console.error("Get Doctor By Id Error:", error);
    return res.status(500).json({ message: "Failed to fetch doctor details", error: error.message });
  }
}

// PUT /api/doctors/availability (Doctor sets their own availability)
export async function updateAvailability(req, res) {
  try {
    const { availableDays, startTime, endTime } = req.body;

    const availability = await DoctorAvailability.findOneAndUpdate(
      { doctor: req.user._id },
      {
        doctor: req.user._id,
        availableDays: availableDays || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        startTime: startTime || "09:00",
        endTime: endTime || "17:00",
      },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      message: "Availability updated successfully",
      availability,
    });
  } catch (error) {
    console.error("Update Availability Error:", error);
    return res.status(500).json({ message: "Failed to update availability", error: error.message });
  }
}
