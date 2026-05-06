import express from "express";
import { body } from "express-validator";
import {
  createMissingPersonAlert,
  getPublicAlert,
  listAlertsByRegion,
  broadcastMissingPersonSMS,
} from "../controllers/missingPersonController.js";
import { uploadSingle } from "../middleware/uploadMiddleware.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create a missing person alert (authenticated user)
router.post(
  "/",
  protect,
  uploadSingle,
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("contactNumber")
      .notEmpty()
      .withMessage("Contact number is required"),
  ],
  createMissingPersonAlert
);

// Public shareable link
router.get("/public/:publicId", getPublicAlert);

// Public list by region
router.get("/public", listAlertsByRegion);

// Admin: broadcast SMS for an approved alert
router.post("/:id/broadcast", protect, adminOnly, broadcastMissingPersonSMS);

export default router;

