import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import {
  getAdminOverview,
  listHarassmentReportsAdmin,
  updateHarassmentStatusAdmin,
  listMissingAlertsAdmin,
  updateMissingAlertStatusAdmin,
} from "../controllers/adminController.js";

const router = express.Router();

router.use(protect);
router.use(adminOnly);

router.get("/overview", getAdminOverview);
router.get("/harassment", listHarassmentReportsAdmin);
router.patch("/harassment/:id", updateHarassmentStatusAdmin);
router.get("/missing", listMissingAlertsAdmin);
router.patch("/missing/:id", updateMissingAlertStatusAdmin);

export default router;

