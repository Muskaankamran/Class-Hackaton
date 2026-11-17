import express from "express";
import {
  getAdminStats,
  getAllUsers,
  addDoctor,
  deleteUser,
  toggleUserStatus,
  getAllAppointments,
  updateAppointmentStatusByAdmin,
} from "../controllers/admin.controller.js";
import { authenticateToken, requireAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authenticateToken, requireAdmin);

router.get("/stats", getAdminStats);
router.get("/users", getAllUsers);
router.post("/doctors", addDoctor);
router.delete("/users/:id", deleteUser);
router.patch("/users/:id/status", toggleUserStatus);
router.get("/appointments", getAllAppointments);
router.patch("/appointments/:id/status", updateAppointmentStatusByAdmin);

export default router;
