import express from "express";
import { searchPoliceStations } from "../controllers/policeStationController.js";

const router = express.Router();

router.get("/search", searchPoliceStations);
router.post("/search", searchPoliceStations);

export default router;
