import bcrypt from "bcryptjs";
import User from "../models/users.model.js";
import DoctorAvailability from "../models/availability.model.js";

export async function seedAdminUser() {
  try {
    // 1. Seed Admin
    const adminExists = await User.findOne({ email: "admin@clinic.com" });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await User.create({
        name: "Admin User",
        email: "admin@clinic.com",
        password: hashedPassword,
        role: "admin",
        isActive: true,
      });
      console.log("Default Admin created: admin@clinic.com / admin123");
    }

    // 2. Seed Doctor (Dr. Ahmed from testing brief)
    const doctorExists = await User.findOne({ email: "ahmed@clinic.com" });
    if (!doctorExists) {
      const hashedPassword = await bcrypt.hash("doctor123", 10);
      const doc = await User.create({
        name: "Dr. Ahmed",
        email: "ahmed@clinic.com",
        password: hashedPassword,
        role: "doctor",
        specialization: "Cardiologist",
        experience: 5,
        isActive: true,
      });

      await DoctorAvailability.create({
        doctor: doc._id,
        availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        startTime: "09:00",
        endTime: "17:00",
      });
      console.log("Default Doctor created: ahmed@clinic.com / doctor123");
    }

    // 3. Seed Patient (Sarah Khan)
    const patientExists = await User.findOne({ email: "patient@clinic.com" });
    if (!patientExists) {
      const hashedPassword = await bcrypt.hash("patient123", 10);
      await User.create({
        name: "Sarah Khan",
        email: "patient@clinic.com",
        password: hashedPassword,
        role: "patient",
        isActive: true,
      });
      console.log("Default Patient created: patient@clinic.com / patient123");
    }
  } catch (error) {
    console.error("Error seeding default accounts:", error);
  }
}
