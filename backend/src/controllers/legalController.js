import { validationResult } from "express-validator";
import LegalInteraction from "../models/LegalInteraction.js";
import { generateLegalGuidance } from "../services/openaiService.js";
import { generateComplaintPdf } from "../services/pdfService.js";
import { memoryStore, useInMemoryDb } from "../config/db.js";

export const legalChat = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { message } = req.body;

  try {
    const aiResponse = await generateLegalGuidance(message);

    let interaction;
    if (useInMemoryDb) {
      interaction = {
        id: crypto.randomUUID(),
        user: req.user?.id,
        messages: [
          { role: "user", content: message, createdAt: new Date() },
          { role: "assistant", content: aiResponse, createdAt: new Date() },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryStore.legalInteractions.push(interaction);
    } else {
      interaction = await LegalInteraction.create({
        user: req.user?._id,
        messages: [
          { role: "user", content: message },
          { role: "assistant", content: aiResponse },
        ],
      });
    }

    res.json({
      interactionId: interaction._id || interaction.id,
      reply: aiResponse,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to get legal guidance. Please try again later.",
    });
  }
};

export const generateFirPdf = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    return res.json({ errors: errors.array() });
  }

  const { complainantName, complainantAddress, contactNumber, body } = req.body;

  try {
    generateComplaintPdf(
      { complainantName, complainantAddress, contactNumber, body },
      res
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to generate PDF" });
  }
};

