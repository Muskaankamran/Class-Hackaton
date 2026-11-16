import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  appointmentDate: {
    type: Date,
    required: true,
  },
  appointmentTime: {
    type: String,
    required: true,
    match: /^([01]\d|2[0-3]):[0-5]\d$/,
  },
  reason: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "cancelled", "completed"],
    default: "pending",
  },
  slotKey: {
    type: String,
    unique: true,
    sparse: true,
    select: false,
  },
}, { timestamps: true });

appointmentSchema.index({ doctor: 1, appointmentDate: 1, appointmentTime: 1, status: 1 });

const appointmentModel = mongoose.model("appointment", appointmentSchema);
export default appointmentModel;
