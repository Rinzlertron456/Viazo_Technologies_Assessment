import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { authorize } from "../middleware/rbac";
import {
  listPharmacies,
  createPharmacy,
  updatePharmacy,
  deletePharmacy,
} from "../controllers/pharmacy.controller";

const router = Router();
router.get("/", authenticate, authorize("Admin", "SuperAdmin"), listPharmacies);
router.post(
  "/",
  authenticate,
  authorize("Admin", "SuperAdmin"),
  createPharmacy,
);
router.put(
  "/:id",
  authenticate,
  authorize("Admin", "SuperAdmin"),
  updatePharmacy,
);
router.delete(
  "/:id",
  authenticate,
  authorize("Admin", "SuperAdmin"),
  deletePharmacy,
);

export default router;
