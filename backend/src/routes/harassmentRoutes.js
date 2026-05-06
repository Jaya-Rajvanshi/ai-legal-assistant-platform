import express from "express";
import { body } from "express-validator";
import {
  createHarassmentReport,
  getReportByTrackingId,
  generateSummary,
} from "../controllers/harassmentController.js";
import { uploadSingle } from "../middleware/uploadMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public or authenticated: allow anonymous, but attach user if logged in
router.post(
  "/",
  uploadSingle,
  [
    body("description")
      .notEmpty()
      .withMessage("Description of the incident is required"),
    body("email")
      .optional({ values: "falsy" })
      .isEmail()
      .withMessage("Provide a valid email if provided"),
  ],
  // protect is optional: we will not force it, but if included, it will be after validations
  (req, res, next) => {
    // optional auth: if Authorization header present, run protect; else skip
    if (req.headers.authorization) {
      return protect(req, res, next);
    }
    return next();
  },
  createHarassmentReport
);

// Generate AI summary from form data (no auth, JSON body)
router.post("/generate-summary", generateSummary);

// Public: check status by tracking ID
router.get("/:trackingId", getReportByTrackingId);

export default router;

