import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { authorize } from "../middleware/rbac";
import {
  getPendingVerifications,
  approveLicense,
  rejectLicense,
} from "../controllers/license.controller";

const router = Router();
router.get(
  "/pending",
  authenticate,
  authorize("Admin", "SuperAdmin"),
  getPendingVerifications,
);
router.patch(
  "/:doctorId/approve",
  authenticate,
  authorize("Admin", "SuperAdmin"),
  approveLicense,
);
router.patch(
  "/:doctorId/reject",
  authenticate,
  authorize("Admin", "SuperAdmin"),
  rejectLicense,
);

export default router;
