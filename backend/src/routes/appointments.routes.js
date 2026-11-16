import express from "express";
import {
  bookAppointment,
  cancelAppointment,
  completeAppointment,
  getDoctorAppointments,
  getAvailability,
  getMyAppointments,
  updateAppointmentStatus,
} from "../controllers/appointments.controller.js";
import { authenticateToken, requireRole } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authenticateToken);
router.post("/", requireRole("patient"), bookAppointment);
router.get("/my", requireRole("patient"), getMyAppointments);
router.get("/doctor", requireRole("doctor"), getDoctorAppointments);
router.get("/availability", requireRole("patient"), getAvailability);
router.patch("/:id/status", requireRole("doctor"), updateAppointmentStatus);
router.patch("/:id/complete", requireRole("doctor"), completeAppointment);
router.patch("/:id/cancel", requireRole("patient"), cancelAppointment);

export default router;
