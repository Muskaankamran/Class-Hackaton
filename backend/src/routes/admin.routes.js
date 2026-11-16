import express from "express";
import {
  createDoctor,
  deleteUser,
  getAllAppointments,
  getStats,
  getUsers,
  updateDoctor,
  updateUserStatus,
} from "../controllers/admin.controller.js";
import { authenticateToken, requireAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authenticateToken, requireAdmin);
router.get("/users", getUsers);
router.post("/doctors", createDoctor);
router.patch("/doctors/:id", updateDoctor);
router.delete("/users/:id", deleteUser);
router.patch("/users/:id/status", updateUserStatus);
router.get("/appointments", getAllAppointments);
router.get("/stats", getStats);

export default router;
