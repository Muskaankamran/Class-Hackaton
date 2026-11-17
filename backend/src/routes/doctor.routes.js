import express from "express";
import {
  getAllDoctors,
  getDoctorById,
  updateAvailability,
} from "../controllers/doctor.controller.js";
import { authenticateToken, requireDoctor } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authenticateToken, getAllDoctors);
router.put("/availability", authenticateToken, requireDoctor, updateAvailability);
router.get("/:id", authenticateToken, getDoctorById);

export default router;
