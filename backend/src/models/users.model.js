import mongoose from "mongoose";

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
