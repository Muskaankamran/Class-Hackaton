import appointmentModel from "../models/appointments.model.js";
import userModel from "../models/users.model.js";
import {
  getAnalyticsSummary,
  getAssistantReply,
  getSpecializationSuggestions,
  redactPersonalDetails,
} from "../../services/ai.service.js";

function logAIUnavailable(feature) {
  console.warn(`MediAura AI ${feature} unavailable; using a non-AI fallback`);
}

async function postAssistantMessage(req, res) {
  const { message } = req.body ?? {};
  if (typeof message !== "string" || !message.trim() || message.length > 1000) {
    return res.status(400).json({ message: "A message of 1–1000 characters is required" });
  }

  const safeMessage = redactPersonalDetails(message.trim());
  const specializations = await userModel.distinct("specialization", {
    role: "doctor",
    isActive: true,
    specialization: { $type: "string", $ne: "" },
  });
  let reply = null;
  let aiAvailable = false;
  try {
    reply = await getAssistantReply(safeMessage, specializations);
    aiAvailable = Boolean(reply);
  } catch {
    reply = null;
  }

  if (!reply) {
    logAIUnavailable("assistant");
    reply = "I can guide you through booking: choose an active doctor, select an available date and time, and submit your visit reason. I can share booking information, but I can’t provide medical advice.";
  }
  return res.status(200).json({ reply, aiAvailable });
}

async function postDoctorRecommendation(req, res) {
  const { reason, noPersonalInfo } = req.body ?? {};
  if (typeof reason !== "string" || !reason.trim() || reason.length > 1000) {
    return res.status(400).json({ message: "A visit description of 1–1000 characters is required" });
  }
  if (noPersonalInfo !== true) {
    return res.status(400).json({ message: "Confirm that your description contains no personal or identifying details" });
  }

  const specializations = await userModel.distinct("specialization", {
    role: "doctor",
    isActive: true,
    specialization: { $type: "string", $ne: "" },
  });
  let recommendationResult = null;
  try {
    recommendationResult = await getSpecializationSuggestions(
      redactPersonalDetails(reason.trim()),
      specializations,
    );
  } catch {
    recommendationResult = null;
  }

  if (!recommendationResult) {
    logAIUnavailable("recommendations");
    return res.status(200).json({
      aiAvailable: false,
      message: "AI recommendations are unavailable right now. You can still browse the active doctors below.",
      recommendations: [],
    });
  }
  if (!recommendationResult.available) {
    return res.status(200).json({
      aiAvailable: false,
      message: "For privacy, include a general health topic such as joint discomfort, without personal or identifying details.",
      recommendations: [],
    });
  }

  const normalizedOptions = new Map(
    specializations.map((specialization) => [
      specialization.trim().toLocaleLowerCase(),
      specialization,
    ]),
  );
  const matchedSpecializations = [...new Set(
    recommendationResult.specializations
      .filter((value) => typeof value === "string")
      .map((value) => normalizedOptions.get(value.trim().toLocaleLowerCase()))
      .filter(Boolean),
  )];
  const recommendations = matchedSpecializations.length
    ? await userModel.find({
      role: "doctor",
      isActive: true,
      specialization: { $in: matchedSpecializations },
    })    .select("name specialization qualification experience consultationFee profileImage availability").sort({ name: 1 })
    : [];
  return res.status(200).json({
    aiAvailable: true,
    specializations: matchedSpecializations,
    recommendations,
  });
}

async function getAIAnalytics(req, res) {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [totalAppointments, statusGroups, dailyGroups] = await Promise.all([
    appointmentModel.countDocuments(),
    appointmentModel.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    appointmentModel.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);
  const statusCounts = {
    pending: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0,
    completed: 0,
  };
  for (const group of statusGroups) {
    if (Object.hasOwn(statusCounts, group._id)) {
      statusCounts[group._id] = group.count;
    }
  }
  const weeklyBookings = dailyGroups.reduce((total, group) => total + group.count, 0);
  const facts = { totalAppointments, statusCounts, weeklyBookings, periodDays: 7 };
  const appointmentNoun = (count) => count === 1 ? "appointment" : "appointments";
  const fallbackSummary = `The clinic has ${totalAppointments} ${appointmentNoun(totalAppointments)} recorded: ${statusCounts.pending} pending, ${statusCounts.approved} approved, ${statusCounts.rejected} rejected, ${statusCounts.cancelled} cancelled, and ${statusCounts.completed} completed. ${weeklyBookings} ${appointmentNoun(weeklyBookings)} were booked in the last seven days.`;
  let summary = null;
  try {
    summary = await getAnalyticsSummary(facts);
  } catch {
    summary = null;
  }
  if (!summary) {
    logAIUnavailable("analytics");
  }
  return res.status(200).json({
    summary: summary || fallbackSummary,
    aiAvailable: Boolean(summary),
    totalAppointments,
    statusCounts,
    dailyBookings: dailyGroups.map(({ _id, count }) => ({ date: _id, count })),
  });
}

export { postAssistantMessage, postDoctorRecommendation, getAIAnalytics };
