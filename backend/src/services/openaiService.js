import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load backend/.env reliably even with ESM import hoisting.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "..", "..", ".env") });

const AI_API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
const AI_BASE_URL =
  process.env.AI_BASE_URL ||
  process.env.OPENAI_BASE_URL ||
  "https://api.openai.com/v1";
const AI_MODEL = process.env.AI_MODEL || process.env.OPENAI_MODEL || "gpt-4.1-mini";
const AI_PROVIDER = (process.env.AI_PROVIDER || "auto").toLowerCase();

if (!AI_API_KEY) {
  console.warn("AI_API_KEY is not set. AI features will not work.");
}

function getAiClient() {
  return axios.create({
    baseURL: AI_BASE_URL,
    headers: {
      Authorization: `Bearer ${AI_API_KEY}`,
      "Content-Type": "application/json",
    },
  });
}

async function geminiGenerateContent({ systemPrompt, messages }) {
  const model =
    !AI_MODEL || AI_MODEL.toLowerCase().includes("gpt")
      ? "gemini-flash-latest"
      : AI_MODEL;
  const resolvedModel = model.replace(/^gemini-1\.5-.+$/i, "gemini-flash-latest");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    resolvedModel
  )}:generateContent`;

  const contents = [];
  if (systemPrompt) {
    contents.push({
      role: "user",
      parts: [{ text: `System:\n${systemPrompt}` }],
    });
  }

  for (const m of messages) {
    const role = m.role === "assistant" ? "model" : "user";
    contents.push({ role, parts: [{ text: m.content }] });
  }

  const { data } = await axios.post(
    url,
    { contents },
    { params: { key: AI_API_KEY } }
  );

  const text =
    data?.candidates?.[0]?.content?.parts
      ?.map((p) => p.text)
      .filter(Boolean)
      .join("") || "";
  return text.trim();
}

export const generateLegalGuidance = async (userMessage) => {
  if (!AI_API_KEY) {
    return "Sorry, I couldn’t process your request right now. Please try again.";
  }

  const prompt = `
You are an Indian legal assistant. The user will describe a legal or harassment situation.
Provide:
1) A clear, plain-language summary of their situation
2) High-level legal guidance and next steps (not legal advice)
3) Suggested relevant IPC sections (if applicable)
4) A structured FIR / police complaint draft they can file.

User situation:
${userMessage}
`;

  const systemPrompt =
    "You are a legal assistant helping Indian citizens understand their options. You are not a lawyer and cannot guarantee outcomes.";

  const useGemini =
    AI_PROVIDER === "gemini" ||
    (AI_PROVIDER === "auto" &&
      (AI_API_KEY.startsWith("AIza") || AI_BASE_URL.includes("googleapis.com")));

  if (useGemini) {
    return await geminiGenerateContent({
      systemPrompt,
      messages: [{ role: "user", content: prompt }],
    });
  }

  const client = getAiClient();
  const { data } = await client.post("/chat/completions", {
    model: AI_MODEL,
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      { role: "user", content: prompt },
    ],
  });

  return data.choices?.[0]?.message?.content?.trim() || "";
};

export const categorizeComplaintAndTranslate = async (description) => {
  if (!AI_API_KEY) {
    return {
      category: "",
      translatedText: "",
      emailTemplateText: "",
    };
  }

  const prompt = `
Given this harassment/cyberbullying complaint description:
${description}

1) Suggest a short category (e.g., "Workplace harassment", "Cyber stalking", "Domestic abuse").
2) Provide a concise, formal summary suitable for an official complaint.
3) Provide the same summary in Hindi as well.
4) Draft a formal email body that could be sent to police/cybercrime authorities.

Return in JSON with keys: category, translatedText, emailTemplateText.
`;

  const client = getAiClient();
  const { data } = await client.post("/chat/completions", {
    model: process.env.AI_MODEL || process.env.OPENAI_MODEL || "gpt-4.1-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const json = JSON.parse(data.choices?.[0]?.message?.content || "{}");
  return {
    category: json.category || "",
    translatedText: json.translatedText || "",
    emailTemplateText: json.emailTemplateText || "",
  };
};

export const rewriteMissingPersonDescription = async (details) => {
  if (!AI_API_KEY) {
    return {
      rewrittenDescription: "",
      headline: "",
      callToAction: "",
    };
  }

  const prompt = `
You are creating a public alert for a missing person in India.
Given the following details, write:
1) A clear, compassionate description suitable for social media and posters.
2) A short, bold headline.
3) A call-to-action asking people to contact the provided number if they have information.

Details:
${details}

Return JSON with keys: rewrittenDescription, headline, callToAction.
`;

  const client = getAiClient();
  const { data } = await client.post("/chat/completions", {
    model: process.env.AI_MODEL || process.env.OPENAI_MODEL || "gpt-4.1-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const json = JSON.parse(data.choices?.[0]?.message?.content || "{}");
  return {
    rewrittenDescription: json.rewrittenDescription || "",
    headline: json.headline || "",
    callToAction: json.callToAction || "",
  };
};

/**
 * Generate a structured legal summary for a crime-against-women complaint form.
 * @param {object} formData - { reportType, victim, accused, incident }
 * @returns {Promise<string>} - AI-generated legal summary
 */
export const generateCrimeAgainstWomenSummary = async (formData) => {
  const prompt = `
You are an Indian legal assistant. Generate a structured legal summary for a crime-against-women complaint.Complaint type: ${formData.reportType || "Not specified"}VICTIM DETAILS:
- Name: ${formData.victim?.fullName || "—"}
- Age: ${formData.victim?.age || "—"}
- Gender: ${formData.victim?.gender || "—"}
- Mobile: ${formData.victim?.mobile || "—"}
- Address: ${formData.victim?.address || "—"}
- Occupation: ${formData.victim?.occupation || "—"}
- Filing on behalf of victim: ${formData.victim?.filingOnBehalf || "—"}

ACCUSED (if known):
- Name: ${formData.accused?.name || "—"}
- Relationship to victim: ${formData.accused?.relationship || "—"}
- Address: ${formData.accused?.address || "—"}
- Mobile: ${formData.accused?.mobile || "—"}
- Workplace: ${formData.accused?.workplace || "—"}

INCIDENT:
- Date: ${formData.incident?.date || "—"}
- Time: ${formData.incident?.time || "—"}
- Location: ${formData.incident?.location || "—"}
- Description: ${formData.incident?.description || "—"}
- Witnesses: ${formData.incident?.witnesses || "—"} ${formData.incident?.witnessDetails ? `Details: ${formData.incident.witnessDetails}` : ""}
- Police informed: ${formData.incident?.policeInformed || "—"} ${formData.incident?.policeInformed === "yes" ? `FIR: ${formData.incident?.firNumber || ""}, Station: ${formData.incident?.policeStation || ""}` : ""}
- Medical treatment: ${formData.incident?.medicalTreatment || "—"}Provide:
1) A clear, structured legal summary of the complaint suitable for authorities.
2) Suggested relevant IPC/sections if applicable.
3) Recommended next steps (e.g., approach women's cell, preserve evidence).
4) A short FIR-style paragraph that can be used when filing.
Keep the tone formal and factual. Do not give personal legal advice.
`;
  if (!AI_API_KEY) {
    return "AI summary is not available (OpenAI not configured). Please fill the form and submit; you can still download or share your complaint.";
  }

  try {
    const client = getAiClient();
    const { data } = await client.post("/chat/completions", {
      model: process.env.AI_MODEL || process.env.OPENAI_MODEL || "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a legal assistant helping with crime-against-women complaints in India. Output a structured, formal summary only.",
        },
        { role: "user", content: prompt },
      ],
    });
    const content = data.choices?.[0]?.message?.content?.trim() || "";
    return content;
  } catch (err) {
    console.error("generateCrimeAgainstWomenSummary failed:", err.message);
    throw err;
  }
};

/** Enhance missing person description for clarity and structure (production module). */
export const enhanceMissingPersonDescription = async (rawDescription) => {
  if (!AI_API_KEY) return rawDescription;

  try {
    const client = getAiClient();
    const { data } = await client.post("/chat/completions", {
      model: process.env.AI_MODEL || process.env.OPENAI_MODEL || "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "You help rewrite missing person descriptions to be clear, structured, and suitable for official posters. Keep the same facts; improve clarity and formatting. Output only the enhanced description text, no JSON.",
        },
        {
          role: "user",
          content: `Enhance this missing person description for a poster:\n\n${rawDescription}`,
        },
      ],
    });
    const content = data.choices?.[0]?.message?.content?.trim();
    return content || rawDescription;
  } catch (err) {
    console.error("OpenAI enhanceMissingPersonDescription failed:", err.message);
    return rawDescription;
  }
};

export const chatAiAssistant = async ({ systemPrompt, message, history = [] }) => {
  if (!AI_API_KEY) {
    const err = new Error("AI_NOT_CONFIGURED");
    err.code = "AI_NOT_CONFIGURED";
    throw err;
  }

  const safeHistory = Array.isArray(history)
    ? history
        .filter(
          (m) =>
            m &&
            (m.role === "user" || m.role === "assistant") &&
            typeof m.content === "string" &&
            m.content.trim().length > 0
        )
        .slice(-20)
    : [];

  const useGemini =
    AI_PROVIDER === "gemini" ||
    (AI_PROVIDER === "auto" &&
      (AI_API_KEY.startsWith("AIza") || AI_BASE_URL.includes("googleapis.com")));  if (useGemini) {
    return await geminiGenerateContent({
      systemPrompt,
      messages: [...safeHistory, { role: "user", content: message }],
    });
  }

  const client = getAiClient();
  const { data } = await client.post("/chat/completions", {
    model: AI_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      ...safeHistory,
      { role: "user", content: message },
    ],
  });

  return data.choices?.[0]?.message?.content?.trim() || "";
};