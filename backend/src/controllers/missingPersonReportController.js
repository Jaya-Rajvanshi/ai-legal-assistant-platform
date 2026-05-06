import { validationResult } from "express-validator";
import crypto from "crypto";
import MissingPerson from "../models/MissingPerson.js";
import { memoryStore, useInMemoryDb } from "../config/db.js";
import { enhanceMissingPersonDescription } from "../services/openaiService.js";
import { sendMissingPersonAlertSMS } from "../services/twilioService.js";
import {
  sendMissingPersonSubmissionConfirmation,
  sendMissingPersonApprovalNotification,
} from "../services/emailService.js";
import { generateMissingPersonPosterPdf } from "../services/missingPersonPdfService.js";
import cloudinary from "../config/cloudinary.js";

const uploadPhotoToCloudinary = (buffer, originalname) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "ai-legal-support/missing-person",
        resource_type: "image",
        public_id: originalname?.replace(/\.[^.]+$/, "") || "photo",
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result?.secure_url || null);
      }
    );
    uploadStream.end(buffer);
  });
};

/** POST /api/missing-person - create report */
export const createReport = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      fullName,
      age,
      gender,
      lastSeenLocation,
      dateLastSeen,
      description,
      contactName,
      contactPhone,
      contactEmail,
    } = req.body;

    let photoUrl = null;
    if (req.file?.buffer) {
      try {
        photoUrl = await uploadPhotoToCloudinary(
          req.file.buffer,
          req.file.originalname
        );
      } catch (err) {
        console.error("Cloudinary upload failed:", err.message);
      }
    }

    let enhancedDescription = description;
    try {
      enhancedDescription = await enhanceMissingPersonDescription(description);
    } catch (err) {
      console.error("AI enhancement failed:", err.message);
    }

    const payload = {
      fullName: fullName?.trim(),
      age: Number(age),
      gender: gender || undefined,
      lastSeenLocation: lastSeenLocation?.trim(),
      dateLastSeen: new Date(dateLastSeen),
      description: enhancedDescription,
      photo: photoUrl,
      contactName: contactName?.trim(),
      contactPhone: contactPhone?.trim(),
      contactEmail: contactEmail?.trim() || undefined,
      status: "pending",
    };

    let report;

    if (useInMemoryDb) {
      report = {
        id: crypto.randomUUID(),
        ...payload,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryStore.missingPersonReports.push(report);
    } else {
      report = await MissingPerson.create(payload);
    }

    const reportId = report._id?.toString() || report.id;

    if (report.contactEmail) {
      try {
        await sendMissingPersonSubmissionConfirmation(
          { ...payload, contactEmail: report.contactEmail },
          reportId
        );
      } catch (e) {
        console.error("Submission confirmation email failed:", e.message);
      }
    }

    return res.status(201).json({
      message: "Report submitted successfully",
      id: reportId,
      status: report.status,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Failed to submit report. Please try again." });
  }
};

/** GET /api/missing-person - get all (admin) */
export const getAllReports = async (req, res) => {
  try {
    if (useInMemoryDb) {
      const list = [...memoryStore.missingPersonReports].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      return res.json(list);
    }
    const list = await MissingPerson.find().sort({ createdAt: -1 });
    return res.json(list);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch reports" });
  }
};

/** GET /api/missing-person/:id - public alert (approved only) */
export const getReportById = async (req, res) => {
  try {
    const { id } = req.params;

    if (useInMemoryDb) {
      const report = memoryStore.missingPersonReports.find(
        (r) => r.id === id || r._id === id
      );
      if (!report || report.status !== "approved") {
        return res.status(404).json({ message: "Alert not found" });
      }
      return res.json(report);
    }

    const report = await MissingPerson.findById(id);
    if (!report || report.status !== "approved") {
      return res.status(404).json({ message: "Alert not found" });
    }
    return res.json(report);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

/** PUT /api/missing-person/:id/approve - admin approve */
export const approveReport = async (req, res) => {
  try {
    const { id } = req.params;

    if (useInMemoryDb) {
      const report = memoryStore.missingPersonReports.find(
        (r) => r.id === id || r._id === id
      );
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      report.status = "approved";
      report.updatedAt = new Date();

      try {
        await sendMissingPersonAlertSMS(
          report.contactPhone,
          `Missing Person Alert Approved: ${report.fullName}, Last Seen: ${report.lastSeenLocation}. Check portal for details.`
        );
      } catch (e) {
        console.error("Twilio SMS on approve failed:", e.message);
      }

      if (report.contactEmail) {
        try {
          await sendMissingPersonApprovalNotification(report);
        } catch (e) {
          console.error("Approval email failed:", e.message);
        }
      }

      return res.json(report);
    }

    const report = await MissingPerson.findByIdAndUpdate(
      id,
      { status: "approved" },
      { new: true }
    );
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    try {
      await sendMissingPersonAlertSMS(
        report.contactPhone,
        `Missing Person Alert Approved: ${report.fullName}, Last Seen: ${report.lastSeenLocation}. Check portal for details.`
      );
    } catch (e) {
      console.error("Twilio SMS on approve failed:", e.message);
    }

    if (report.contactEmail) {
      try {
        await sendMissingPersonApprovalNotification(report);
      } catch (e) {
        console.error("Approval email failed:", e.message);
      }
    }

    return res.json(report);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

/** PUT /api/missing-person/:id/reject - admin reject */
export const rejectReport = async (req, res) => {
  try {
    const { id } = req.params;

    if (useInMemoryDb) {
      const report = memoryStore.missingPersonReports.find(
        (r) => r.id === id || r._id === id
      );
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      report.status = "rejected";
      report.updatedAt = new Date();
      return res.json(report);
    }

    const report = await MissingPerson.findByIdAndUpdate(
      id,
      { status: "rejected" },
      { new: true }
    );
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }
    return res.json(report);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

/** GET /api/missing-person/:id/pdf - download poster PDF (approved only) */
export const getReportPdf = async (req, res) => {
  try {
    const { id } = req.params;

    let report;

    if (useInMemoryDb) {
      report = memoryStore.missingPersonReports.find(
        (r) => (r.id === id || r._id === id) && r.status === "approved"
      );
    } else {
      report = await MissingPerson.findOne({
        _id: id,
        status: "approved",
      });
    }

    if (!report) {
      return res.status(404).json({ message: "Alert not found" });
    }

    const plain = report.toObject ? report.toObject() : { ...report };
    generateMissingPersonPosterPdf(plain, res);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to generate PDF" });
  }
};
