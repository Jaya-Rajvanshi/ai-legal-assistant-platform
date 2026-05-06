import User from "../models/User.js";
import HarassmentReport from "../models/HarassmentReport.js";
import MissingPersonAlert from "../models/MissingPersonAlert.js";
import { memoryStore, useInMemoryDb } from "../config/db.js";

export const getAdminOverview = async (req, res) => {
  try {
    if (useInMemoryDb) {
      const userCount = memoryStore.users.length;
      const harassmentCount = memoryStore.harassmentReports.length;
      const missingCount = memoryStore.missingAlerts.length;
      const openHarassment = memoryStore.harassmentReports.filter((r) =>
        ["pending", "in_review"].includes(r.status)
      ).length;
      const activeAlerts = memoryStore.missingAlerts.filter(
        (a) => a.isApproved && a.isActive
      ).length;

      return res.json({
        users: userCount,
        harassmentReports: harassmentCount,
        missingPersonAlerts: missingCount,
        openHarassmentReports: openHarassment,
        activeApprovedAlerts: activeAlerts,
      });
    }

    const [userCount, harassmentCount, missingCount, openHarassment, activeAlerts] =
      await Promise.all([
        User.countDocuments(),
        HarassmentReport.countDocuments(),
        MissingPersonAlert.countDocuments(),
        HarassmentReport.countDocuments({
          status: { $in: ["pending", "in_review"] },
        }),
        MissingPersonAlert.countDocuments({ isApproved: true, isActive: true }),
      ]);

    res.json({
      users: userCount,
      harassmentReports: harassmentCount,
      missingPersonAlerts: missingCount,
      openHarassmentReports: openHarassment,
      activeApprovedAlerts: activeAlerts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch analytics" });
  }
};

export const listHarassmentReportsAdmin = async (req, res) => {
  try {
    if (useInMemoryDb) {
      const reports = [...memoryStore.harassmentReports].sort(
        (a, b) => b.createdAt - a.createdAt
      );
      return res.json(reports);
    }

    const reports = await HarassmentReport.find()
      .sort({ createdAt: -1 })
      .populate("reporter", "name email");
    res.json(reports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateHarassmentStatusAdmin = async (req, res) => {
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
    }

    const report = await HarassmentReport.findById(id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }
    report.status = status;
    await report.save();
    res.json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const listMissingAlertsAdmin = async (req, res) => {
  try {
    if (useInMemoryDb) {
      const alerts = [...memoryStore.missingAlerts].sort(
        (a, b) => b.createdAt - a.createdAt
      );
      return res.json(alerts);
    }

    const alerts = await MissingPersonAlert.find()
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email");
    res.json(alerts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateMissingAlertStatusAdmin = async (req, res) => {
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
    }

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
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

