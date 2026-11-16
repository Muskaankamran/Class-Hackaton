const CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";
const SAFE_TOPIC_TERMS = new Set([
  "ache", "ankle", "arm", "back", "breathing", "chest", "checkup", "discomfort",
  "ear", "eye", "fever", "foot", "head", "headache", "health", "heart", "hip",
  "joint", "knee", "leg", "muscle", "neck", "pain", "rash", "shoulder", "skin",
  "sore", "stomach", "throat", "wellness", "wrist",
]);

async function requestAI(messages, { temperature = 0.2, maxTokens = 300 } = {}) {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(process.env.AI_API_URL || CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || "gpt-4o-mini",
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`AI provider returned HTTP ${response.status}`);
    }
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      throw new Error("AI provider returned an empty response");
    }
    return content.trim();
  } finally {
    clearTimeout(timeout);
  }
}

export function redactPersonalDetails(value) {
  return value
    .slice(0, 1000)
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[redacted contact]")
    .replace(/\b(?:phone|mobile|telephone|email|address|date of birth|dob|medical record|mrn)\s*[:=]\s*[^,;\n]+/gi, "[redacted personal detail]")
    .replace(/\b(?:my name is|patient name is|name:)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}/gi, "[redacted name]")
    .replace(/\bI(?:'m| am)\s+(?:Dr\.?\s+)?[A-Z][A-Za-z'-]+(?:\s+[A-Z][A-Za-z'-]+){0,2}/g, "[redacted name]")
    .replace(/\b\d{1,5}\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3}\s+(?:Street|St|Road|Rd|Avenue|Ave|Lane|Ln|Boulevard|Blvd)\b/gi, "[redacted address]")
    .replace(/\b(?:\+?\d[\d\s().-]{7,}\d)\b/g, "[redacted number]")
    .replace(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g, "[redacted date]");
}

export async function getAssistantReply(message, specializations) {
  const lowered = message.toLocaleLowerCase();
  const requestType = /\b(?:book|booking|schedule|appointment|visit|cancel|reschedule)\b/.test(lowered)
    ? "appointment_navigation"
    : /\b(?:specialty|specialties|specialization|doctor|clinician)\b/.test(lowered)
      ? "clinic_specialties"
      : /\b(?:available|availability|slot|time)\b/.test(lowered)
        ? "appointment_availability"
        : "general_navigation";
  const requestedSpecialty = specializations.find((specialization) =>
    lowered.includes(specialization.toLocaleLowerCase()),
  ) || null;
  return requestAI([
    {
      role: "system",
      content: `You are MediAura's appointment-navigation assistant. Help explain booking steps and describe these doctor specializations only: ${specializations.join(", ") || "none currently listed"}. Do not diagnose, assess symptoms, recommend treatment, or prescribe medication. If asked for medical advice, state that you cannot provide it and suggest contacting a licensed clinician. Keep replies warm, concise, and practical.`,
    },
    { role: "user", content: JSON.stringify({ requestType, requestedSpecialty }) },
  ]);
}

export async function getSpecializationSuggestions(reason, specializations) {
  const words = new Set(reason.toLocaleLowerCase().match(/[a-z]+/g) || []);
  const topicTerms = [...words].filter((word) => SAFE_TOPIC_TERMS.has(word));
  const mentionedSpecialties = specializations.filter((specialization) => {
    const specialtyWords = specialization.toLocaleLowerCase().match(/[a-z]+/g) || [];
    return specialtyWords.length > 0 && specialtyWords.every((word) => words.has(word));
  });
  if (!topicTerms.length && !mentionedSpecialties.length) {
    return { available: false, specializations: [] };
  }

  const content = await requestAI([
    {
      role: "system",
      content: `Suggest up to three relevant doctor specializations from this exact list: ${JSON.stringify(specializations)}. Do not diagnose, name diseases, suggest treatments, or invent specializations. Reply only as JSON: {"specializations":["exact list value"]}. If no listed specialty fits, return {"specializations":[]}.`,
    },
    { role: "user", content: JSON.stringify({ generalTopics: topicTerms, mentionedClinicSpecialties: mentionedSpecialties }) },
  ], { maxTokens: 120 });
  if (!content) {
    return null;
  }
  const json = content.replace(/^```(?:json)?\s*|\s*```$/g, "");
  const result = JSON.parse(json);
  return {
    available: true,
    specializations: Array.isArray(result.specializations) ? result.specializations : [],
  };
}

export async function getAnalyticsSummary(analytics) {
  const content = await requestAI([
    {
      role: "system",
      content: "Summarize this clinic appointment aggregate data in two concise sentences. Use only facts and numeric values present in the data. Do not infer causes, make predictions, or offer medical advice. Reply only as JSON: {\"summary\":\"...\"}.",
    },
    { role: "user", content: JSON.stringify(analytics) },
  ], { maxTokens: 140 });
  if (!content) {
    return null;
  }
  const json = content.replace(/^```(?:json)?\s*|\s*```$/g, "");
  const result = JSON.parse(json);
  if (typeof result.summary !== "string" || !result.summary.trim()) {
    return null;
  }

  const allowedNumbers = new Set(JSON.stringify(analytics).match(/\b\d+\b/g) || []);
  const summaryNumbers = result.summary.match(/\b\d+\b/g) || [];
  if (summaryNumbers.some((number) => !allowedNumbers.has(number))) {
    return null;
  }
  return result.summary.trim();
}
