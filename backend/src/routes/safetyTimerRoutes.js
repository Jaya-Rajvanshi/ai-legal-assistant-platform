import express from "express";
import {
  getSafetyTimerHistory,
  getTrustedContacts,
  saveTrustedContacts,
  startSafetyTimer,
  stopSafetyTimer,
  triggerSafetyTimerAlert,
} from "../controllers/safetyTimerController.js";

const router = express.Router();

router.post("/contacts", saveTrustedContacts);
router.get("/contacts", getTrustedContacts);
router.post("/start", startSafetyTimer);
router.post("/stop", stopSafetyTimer);
router.post("/trigger-alert", triggerSafetyTimerAlert);
router.get("/history", getSafetyTimerHistory);

export default router;
