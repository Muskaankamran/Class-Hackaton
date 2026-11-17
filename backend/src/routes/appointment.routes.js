import express from "express";
import {
  bookAppointment,
  getMyAppointments,
  getDoctorAppointments,
  updateAppointmentStatus,
  cancelAppointment,
} from "../controllers/appointment.controller.js";
import {
  authenticateToken,
  requirePatient,
  requireDoctor,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

// Patient routes
router.post("/", authenticateToken, requirePatient, bookAppointment);
router.get("/my", authenticateToken, requirePatient, getMyAppointments);
router.patch("/:id/cancel", authenticateToken, requirePatient, cancelAppointment);

// Doctor routes
router.get("/doctor", authenticateToken, requireDoctor, getDoctorAppointments);
router.patch("/:id/status", authenticateToken, requireDoctor, updateAppointmentStatus);

export default router;
