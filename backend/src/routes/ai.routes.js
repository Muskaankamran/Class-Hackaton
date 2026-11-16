import express from "express";
import {
  getAIAnalytics,
  postAssistantMessage,
  postDoctorRecommendation,
} from "../controllers/ai.controller.js";
import { authenticateToken, requireAdmin, requireRole } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authenticateToken);
router.post("/assistant", requireRole("patient"), postAssistantMessage);
router.post("/recommendations", requireRole("patient"), postDoctorRecommendation);
router.get("/analytics", requireAdmin, getAIAnalytics);

export default router;
