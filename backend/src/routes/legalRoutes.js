import express from "express";
import { body } from "express-validator";
import {
  legalChat,
  generateFirPdf,
} from "../controllers/legalController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// AI legal chat (authenticated recommended but not required)
router.post(
  "/chat",
  [body("message").notEmpty().withMessage("Message is required")],
  protect,
  legalChat
);

// FIR/complaint PDF generation
router.post(
  "/complaint-pdf",
  [
    body("body").notEmpty().withMessage("Complaint body is required"),
    body("complainantName")
      .optional()
      .isLength({ max: 120 })
      .withMessage("Name too long"),
  ],
  generateFirPdf
);

export default router;

