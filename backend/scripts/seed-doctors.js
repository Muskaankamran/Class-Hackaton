import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import connectDB from "../src/db/db.js";
import userModel from "../src/models/users.model.js";

const sampleDoctors = [
  {
    name: "Dr. Maya Bennett",
    email: "maya.bennett@mediaura.test",
    specialization: "Cardiologist",
    qualification: "MBBS, MD Cardiology",
    experience: 12,
    consultationFee: 150,
    availability: {
      workingDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      startTime: "09:00",
      endTime: "17:00",
      appointmentDurationMinutes: 30,
    },
  },
  {
    name: "Dr. Elias Morgan",
    email: "elias.morgan@mediaura.test",
    specialization: "Dermatologist",
    qualification: "MBBS, MD Dermatology",
    experience: 9,
    consultationFee: 110,
    availability: {
      workingDays: ["monday", "tuesday", "thursday", "friday", "saturday"],
      startTime: "08:30",
      endTime: "16:30",
      appointmentDurationMinutes: 30,
    },
  },
  {
    name: "Dr. Nadia Rahman",
    email: "nadia.rahman@mediaura.test",
    specialization: "Neurologist",
    qualification: "MBBS, DM Neurology",
    experience: 15,
    consultationFee: 180,
    availability: {
      workingDays: ["monday", "wednesday", "thursday", "friday"],
      startTime: "10:00",
      endTime: "18:00",
      appointmentDurationMinutes: 40,
    },
  },
  {
    name: "Dr. Oliver Chen",
    email: "oliver.chen@mediaura.test",
    specialization: "Pediatrician",
    qualification: "MBBS, MD Pediatrics",
    experience: 11,
    consultationFee: 95,
    availability: {
      workingDays: ["monday", "tuesday", "wednesday", "friday", "saturday"],
      startTime: "08:00",
      endTime: "15:00",
      appointmentDurationMinutes: 30,
    },
  },
  {
    name: "Dr. Sofia Patel",
    email: "sofia.patel@mediaura.test",
    specialization: "Orthopedic",
    qualification: "MBBS, MS Orthopedics",
    experience: 13,
    consultationFee: 140,
    availability: {
      workingDays: ["tuesday", "wednesday", "thursday", "friday", "saturday"],
      startTime: "09:30",
      endTime: "17:30",
      appointmentDurationMinutes: 30,
    },
  },
  {
    name: "Dr. James Okafor",
    email: "james.okafor@mediaura.test",
    specialization: "General Physician",
    qualification: "MBBS, DFM",
    experience: 8,
    consultationFee: 75,
    availability: {
      workingDays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
      startTime: "08:00",
      endTime: "16:00",
      appointmentDurationMinutes: 20,
    },
  },
];

async function seedDoctors() {
  const password = process.env.SAMPLE_DOCTOR_PASSWORD;
  if (typeof password !== "string" || password.length < 12) {
    throw new Error("Set SAMPLE_DOCTOR_PASSWORD to a strong password of at least 12 characters");
  }
  if (process.env.NODE_ENV === "production" && process.env.SEED_SAMPLE_DOCTORS !== "true") {
    throw new Error("Sample doctor seeding is disabled in production unless SEED_SAMPLE_DOCTORS=true");
  }

  await connectDB();
  const passwordHash = await bcrypt.hash(password, 10);
  let created = 0;
  let skipped = 0;
  for (const doctor of sampleDoctors) {
    const email = doctor.email.toLowerCase();
    const existing = await userModel.findOne({
      $or: [{ email }, { username: email }],
    }).select("role");
    if (existing) {
      if (existing.role !== "doctor") {
        throw new Error(`Cannot seed ${email}: the account belongs to a non-doctor`);
      }
      skipped += 1;
      continue;
    }

    await userModel.create({
      ...doctor,
      email,
      username: email,
      password: passwordHash,
      role: "doctor",
      isActive: true,
    });
    created += 1;
  }
  console.log(`Sample doctor seed complete: ${created} created, ${skipped} already present`);
}

seedDoctors()
  .catch((error) => {
    console.error("Sample doctor seeding failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
