import express from "express";
import { body } from "express-validator";
import {
  createReport,
  getAllReports,
  getReportById,
  approveReport,
  rejectReport,
  getReportPdf,
} from "../controllers/missingPersonReportController.js";
import { uploadSingle } from "../middleware/uploadMiddleware.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
  "/",
  uploadSingle,
  [
    body("fullName").notEmpty().trim().withMessage("Full name is required"),
    body("age").isInt({ min: 0, max: 150 }).withMessage("Valid age is required"),
    body("lastSeenLocation").notEmpty().trim().withMessage("Last seen location is required"),
    body("dateLastSeen").notEmpty().withMessage("Date last seen is required"),
    body("description").notEmpty().trim().withMessage("Description is required"),
    body("contactName").notEmpty().trim().withMessage("Contact name is required"),
    body("contactPhone").notEmpty().trim().withMessage("Contact phone is required"),
  ],
  createReport
);

router.get("/", protect, adminOnly, getAllReports);

router.get("/:id", getReportById);

router.put("/:id/approve", protect, adminOnly, approveReport);

router.put("/:id/reject", protect, adminOnly, rejectReport);

router.get("/:id/pdf", getReportPdf);

export default router;
