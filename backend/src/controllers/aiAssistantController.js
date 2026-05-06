import { validationResult } from "express-validator";
import { chatAiAssistant } from "../services/openaiService.js";
import {
  FAILSAFE_REPLY,
  getFallbackKnowledge,
  getPredefinedAssistantReply,
} from "../services/aiAssistantIntents.js";

const BASE_SYSTEM_PROMPT = `You are Nayay Setu AI, a legal and emergency guidance assistant for India.

Your job is to answer the user’s exact situation specifically, not with generic broad advice.

Rules:
- Give practical, situation-based guidance tailored to the user’s message
- Use the conversation history for context (follow-ups must make sense)
- Ask for one brief clarification only if truly needed to give safe/accurate steps
- Do not act like a lawyer
- Do not guarantee legal outcomes
- Do not fabricate laws, police procedures, or helpline details
- If the user describes danger or urgent risk, prioritize immediate safety and contacting emergency authorities
- Keep responses clear, calm, supportive, and directly relevant to the exact case
- Avoid generic template replies unless the user provides no details
- Mention this disclaimer when appropriate:
  ‘This is general legal information, not a substitute for a licensed lawyer or emergency authority.’`;

export const aiAssistantChat = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { message, history } = req.body;

  try {
    const knowledge = getFallbackKnowledge(message);
    const systemPrompt = knowledge
      ? `${BASE_SYSTEM_PROMPT}\n\nHelpful reference (use only if relevant; do NOT output as a template):\n${knowledge}`
      : BASE_SYSTEM_PROMPT;

    try {
      const reply = await chatAiAssistant({
        systemPrompt,
        message,
        history,
      });

      if (reply && String(reply).trim().length > 0) {
        return res.json({ reply });
      }

      // If the AI returns empty, use a lightweight fallback rather than showing an error.
      const predefined = getPredefinedAssistantReply(message);
      return res.json({ reply: predefined || FAILSAFE_REPLY });
    } catch (aiErr) {
      const status = aiErr?.response?.status;
      const data = aiErr?.response?.data;
      console.error(
        "AI assistant LLM failed:",
        status ? `status=${status}` : "",
        aiErr?.message || aiErr,
        data ? `data=${JSON.stringify(data).slice(0, 800)}` : ""
      );
      const predefined = getPredefinedAssistantReply(message);
      return res.json({ reply: predefined || FAILSAFE_REPLY });
    }
  } catch (err) {
    console.error("AI assistant chat failed:", err?.message || err);
    const predefined = getPredefinedAssistantReply(message);
    return res.json({ reply: predefined || FAILSAFE_REPLY });
  }
};

