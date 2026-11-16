import express from "express";
import { getDoctorById, getDoctors, updateMyAvailability } from "../controllers/doctors.controller.js";
import { authenticateToken, requireRole } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authenticateToken);
router.get("/", getDoctors);
router.patch("/me/availability", requireRole("doctor"), updateMyAvailability);
router.get("/:id", getDoctorById);

export default router;
