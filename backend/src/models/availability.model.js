import mongoose from "mongoose";

const doctorAvailabilitySchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    availableDays: {
      type: [String],
      default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    },
    startTime: {
      type: String,
      default: "09:00",
    },
    endTime: {
      type: String,
      default: "17:00",
    },
  },
  { timestamps: true }
);

const DoctorAvailability = mongoose.model("DoctorAvailability", doctorAvailabilitySchema);
export default DoctorAvailability;
