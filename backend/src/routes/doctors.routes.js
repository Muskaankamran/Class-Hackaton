import express from "express";
import { getDoctorById, getDoctors } from "../controllers/doctors.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authenticateToken);
router.get("/", getDoctors);
router.get("/:id", getDoctorById);

export default router;
