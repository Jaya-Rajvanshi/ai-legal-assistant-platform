import { validationResult } from "express-validator";
import crypto from "crypto";
import HarassmentReport from "../models/HarassmentReport.js";
import cloudinary from "../config/cloudinary.js";
import {
  categorizeComplaintAndTranslate,
  generateCrimeAgainstWomenSummary,
} from "../services/openaiService.js";
import { memoryStore, useInMemoryDb } from "../config/db.js";

const generateTrackingId = () =>
  `HR-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

const uploadToCloudinary = (fileBuffer, originalname, mimetype) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "ai-legal-support/harassment-evidence",
        resource_type: "auto",
        public_id: originalname?.split(".")[0],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });
};

export const createHarassmentReport = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    isAnonymous = false,
    name,
    email,
    description,
    lat,
    lng,
    address,
  } = req.body;

  try {
    const trackingId = generateTrackingId();

    let evidenceUrl = null;
    let evidenceType = null;

    if (req.file && req.file.buffer) {
      const uploaded = await uploadToCloudinary(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
      evidenceUrl = uploaded.secure_url;
      evidenceType = req.file.mimetype;
    }

    let aiData = {};
    try {
      aiData = await categorizeComplaintAndTranslate(description);
    } catch (err) {
      console.error("OpenAI categorizeComplaint failed:", err.message);
    }

    let report;
    if (useInMemoryDb) {
      report = {
        id: crypto.randomUUID(),
        isAnonymous,
        reporter: isAnonymous ? null : req.user?.id,
        name: isAnonymous ? undefined : name,
        email: isAnonymous ? undefined : email,
        description,
        category: aiData.category,
        translatedText: aiData.translatedText,
        emailTemplateText: aiData.emailTemplateText,
        evidenceUrl,
        evidenceType,
        location: {
          lat: lat ? Number(lat) : undefined,
          lng: lng ? Number(lng) : undefined,
          address,
        },
        trackingId,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryStore.harassmentReports.push(report);
    } else {
      report = await HarassmentReport.create({
        isAnonymous,
        reporter: isAnonymous ? null : req.user?._id,
        name: isAnonymous ? undefined : name,
        email: isAnonymous ? undefined : email,
        description,
        category: aiData.category,
        translatedText: aiData.translatedText,
        emailTemplateText: aiData.emailTemplateText,
        evidenceUrl,
        evidenceType,
        location: {
          lat: lat ? Number(lat) : undefined,
          lng: lng ? Number(lng) : undefined,
          address,
        },
        trackingId,
      });
    }

    res.status(201).json({
      success: true,
      message: "Form submitted successfully",
      trackingId: report.trackingId,
      status: report.status,
      category: report.category,
      translatedText: report.translatedText,
      emailTemplateText: report.emailTemplateText,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to submit report. Please try again later." });
  }
};

export const generateSummary = async (req, res) => {
  try {
    const { reportType, victim, accused, incident } = req.body;
    const formData = { reportType, victim: victim || {}, accused: accused || {}, incident: incident || {} };
    const summary = await generateCrimeAgainstWomenSummary(formData);
    res.json({ success: true, summary });
  } catch (error) {
    console.error("generateSummary error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate summary. Please try again.",
      summary: null,
    });
  }
};

export const getReportByTrackingId = async (req, res) => {
  const { trackingId } = req.params;
  try {
    let report;
    if (useInMemoryDb) {
      report = memoryStore.harassmentReports.find(
        (r) => r.trackingId === trackingId
      );
      if (report) {
        // hide emailTemplateText like .select("-emailTemplateText")
        const { emailTemplateText, ...rest } = report;
        report = rest;
      }
    } else {
      report = await HarassmentReport.findOne({ trackingId }).select(
        "-emailTemplateText"
      );
    }
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }
    res.json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const listHarassmentReports = async (req, res) => {
  try {
    if (useInMemoryDb) {
      const reports = [...memoryStore.harassmentReports].sort(
        (a, b) => b.createdAt - a.createdAt
      );
      return res.json(reports);
    } else {
      const reports = await HarassmentReport.find()
        .sort({ createdAt: -1 })
        .populate("reporter", "name email");
      res.json(reports);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateHarassmentStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["pending", "in_review", "resolved", "rejected"].includes(status)) {
    return res.status(400).json({ message: "Invalid status value" });
  }

  try {
    if (useInMemoryDb) {
      const report = memoryStore.harassmentReports.find((r) => r.id === id);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      report.status = status;
      report.updatedAt = new Date();
      return res.json(report);
    } else {
      const report = await HarassmentReport.findById(id);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      report.status = status;
      await report.save();
      res.json(report);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

