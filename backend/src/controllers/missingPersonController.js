import { validationResult } from "express-validator";
import crypto from "crypto";
import cloudinary from "../config/cloudinary.js";
import MissingPersonAlert from "../models/MissingPersonAlert.js";
import { rewriteMissingPersonDescription } from "../services/openaiService.js";
import { sendMissingPersonAlertSMS } from "../services/twilioService.js";
import { memoryStore, useInMemoryDb } from "../config/db.js";

const generatePublicId = () =>
  `MP-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;

const uploadPhotoToCloudinary = (fileBuffer, originalname) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "ai-legal-support/missing-person",
        resource_type: "image",
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

export const createMissingPersonAlert = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    name,
    age,
    gender,
    lastSeenLocation,
    lastSeenDate,
    contactNumber,
    additionalDetails,
    region,
  } = req.body;

  try {
    let photoUrl = null;
    if (req.file && req.file.buffer) {
      const uploaded = await uploadPhotoToCloudinary(
        req.file.buffer,
        req.file.originalname
      );
      photoUrl = uploaded.secure_url;
    }

    const detailsForAI = `
Name: ${name}
Age: ${age || "N/A"}
Gender: ${gender || "N/A"}
Last seen at: ${lastSeenLocation || "N/A"}
Last seen date: ${lastSeenDate || "N/A"}
Additional details: ${additionalDetails || "N/A"}
Contact number: ${contactNumber}
`;

    let aiData = {};
    try {
      aiData = await rewriteMissingPersonDescription(detailsForAI);
    } catch (err) {
      console.error("OpenAI rewriteMissingPersonDescription failed:", err.message);
    }

    const publicId = generatePublicId();

    const posterText = `${aiData.headline || "Missing Person Alert"}

${aiData.rewrittenDescription || ""}

${aiData.callToAction || ""}`;

    let alert;
    if (useInMemoryDb) {
      alert = {
        id: crypto.randomUUID(),
        createdBy: req.user?.id,
        name,
        age: age ? Number(age) : undefined,
        gender,
        lastSeenLocation,
        lastSeenDate: lastSeenDate ? new Date(lastSeenDate) : undefined,
        contactNumber,
        additionalDetails,
        rewrittenDescription: aiData.rewrittenDescription,
        posterText,
        photoUrl,
        region,
        publicId,
        isApproved: false,
        isActive: true,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryStore.missingAlerts.push(alert);
    } else {
      alert = await MissingPersonAlert.create({
        createdBy: req.user?._id,
        name,
        age: age ? Number(age) : undefined,
        gender,
        lastSeenLocation,
        lastSeenDate: lastSeenDate ? new Date(lastSeenDate) : undefined,
        contactNumber,
        additionalDetails,
        rewrittenDescription: aiData.rewrittenDescription,
        posterText,
        photoUrl,
        region,
        publicId,
      });
    }

    res.status(201).json({
      id: alert._id,
      publicId: alert.publicId,
      status: alert.status,
      posterText: alert.posterText,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Failed to create missing person alert." });
  }
};

export const getPublicAlert = async (req, res) => {
  const { publicId } = req.params;
  try {
    let alert;
    if (useInMemoryDb) {
      alert = memoryStore.missingAlerts.find(
        (a) => a.publicId === publicId && a.isApproved && a.isActive
      );
      if (alert) {
        const { createdBy, status, ...rest } = alert;
        alert = rest;
      }
    } else {
      alert = await MissingPersonAlert.findOne({
        publicId,
        isApproved: true,
        isActive: true,
      }).select("-createdBy -status");
    }

    if (!alert) {
      return res.status(404).json({ message: "Alert not found or not active" });
    }

    res.json(alert);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const listAlertsByRegion = async (req, res) => {
  const { region } = req.query;
  const filter = {
    isApproved: true,
    isActive: true,
  };
  if (region) filter.region = region;

  try {
    if (useInMemoryDb) {
      let alerts = memoryStore.missingAlerts.filter(
        (a) => a.isApproved && a.isActive
      );
      if (region) {
        alerts = alerts.filter((a) => a.region === region);
      }
      alerts.sort((a, b) => b.createdAt - a.createdAt);
      alerts = alerts.map(({ createdBy, ...rest }) => rest);
      return res.json(alerts);
    } else {
      const alerts = await MissingPersonAlert.find(filter)
        .sort({ createdAt: -1 })
        .select("-createdBy");
      res.json(alerts);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const listAllAlertsAdmin = async (req, res) => {
  try {
    if (useInMemoryDb) {
      const alerts = [...memoryStore.missingAlerts].sort(
        (a, b) => b.createdAt - a.createdAt
      );
      return res.json(alerts);
    } else {
      const alerts = await MissingPersonAlert.find()
        .sort({ createdAt: -1 })
        .populate("createdBy", "name email");
      res.json(alerts);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateAlertStatus = async (req, res) => {
  const { id } = req.params;
  const { status, isActive } = req.body;

  if (status && !["pending", "approved", "rejected"].includes(status)) {
    return res.status(400).json({ message: "Invalid status value" });
  }

  try {
    if (useInMemoryDb) {
      const alert = memoryStore.missingAlerts.find((a) => a.id === id);
      if (!alert) {
        return res.status(404).json({ message: "Alert not found" });
      }
      if (status) {
        alert.status = status;
        alert.isApproved = status === "approved";
      }
      if (typeof isActive === "boolean") {
        alert.isActive = isActive;
      }
      alert.updatedAt = new Date();
      return res.json(alert);
    } else {
      const alert = await MissingPersonAlert.findById(id);
      if (!alert) {
        return res.status(404).json({ message: "Alert not found" });
      }

      if (status) {
        alert.status = status;
        alert.isApproved = status === "approved";
      }
      if (typeof isActive === "boolean") {
        alert.isActive = isActive;
      }

      await alert.save();
      res.json(alert);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const broadcastMissingPersonSMS = async (req, res) => {
  const { id } = req.params;
  const { numbers } = req.body;

  if (!Array.isArray(numbers) || numbers.length === 0) {
    return res
      .status(400)
      .json({ message: "Provide an array of phone numbers" });
  }

  try {
    let alert;
    if (useInMemoryDb) {
      alert = memoryStore.missingAlerts.find((a) => a.id === id);
    } else {
      alert = await MissingPersonAlert.findById(id);
    }

    if (!alert || !alert.isApproved || !alert.isActive) {
      return res
        .status(400)
        .json({ message: "Alert must be approved and active to broadcast" });
    }

    const message = `Missing Person Alert: ${alert.name}.
Region: ${alert.region || "N/A"}.
Contact: ${alert.contactNumber}.
Details: ${alert.rewrittenDescription || alert.additionalDetails || ""}`;

    const results = await sendMissingPersonAlertSMS(numbers, message);

    res.json({ message: "Broadcast initiated", results });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || "Failed to send SMS" });
  }
};

