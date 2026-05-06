import express from "express";
import {
  getEmergencyHelplines,
  getNearbyPoliceStations,
} from "../controllers/emergencyController.js";

const router = express.Router();

router.get("/helplines", getEmergencyHelplines);
router.post("/police-stations", getNearbyPoliceStations);

export default router;

