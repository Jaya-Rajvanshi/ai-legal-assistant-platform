import express from "express";
import { body } from "express-validator";
import { aiAssistantChat } from "../controllers/aiAssistantController.js";
import rateLimit from "express-rate-limit";

const router = express.Router();

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    reply:
      "I’m getting too many requests right now. Please wait a moment and try again.",
  },
});

router.post(
  "/chat",
  chatLimiter,
  [
    body("message")
      .isString()
      .trim()
      .notEmpty()
      .withMessage("Message is required")
      .isLength({ max: 4000 })
      .withMessage("Message is too long"),
    body("history").optional().isArray().withMessage("History must be an array"),
  ],
  aiAssistantChat
);

export default router;

