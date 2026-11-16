import mongoose from "mongoose";

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const availabilitySchema = new mongoose.Schema({
  workingDays: [{
    type: String,
    enum: WEEKDAYS,
  }],
  startTime: {
    type: String,
    match: /^([01]\d|2[0-3]):[0-5]\d$/,
  },
  endTime: {
    type: String,
    match: /^([01]\d|2[0-3]):[0-5]\d$/,
  },
  appointmentDurationMinutes: {
    type: Number,
    min: 5,
    max: 240,
  },
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    default: "patient",
    enum: ["admin", "doctor", "patient"],
  },
  specialization: {
    type: String,
    trim: true,
    required: function () {
      return this.role === "doctor";
    },
  },
  experience: {
    type: Number,
    min: 0,
    required: function () {
      return this.role === "doctor";
    },
  },
  qualification: {
    type: String,
    trim: true,
    maxlength: 160,
  },
  consultationFee: {
    type: Number,
    min: 0,
  },
  profileImage: {
    type: String,
    trim: true,
    maxlength: 2048,
  },
  availability: {
    type: availabilitySchema,
    default: undefined,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  // Retained for compatibility with existing user documents and consumers.
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  cart: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
  }],
});

const userModel = mongoose.model("user", userSchema);
export default userModel;
