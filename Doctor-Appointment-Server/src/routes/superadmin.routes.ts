import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { authorize } from "../middleware/rbac";
import {
  getHospitals,
  createHospital,
  updateHospital,
  getAllUsers,
  deactivateUser,
  getSystemStats,
} from "../controllers/superadmin.controller";

const router = Router();
router.get("/hospitals", authenticate, authorize("SuperAdmin"), getHospitals);
router.post("/hospitals", authenticate, authorize("SuperAdmin"), createHospital);
router.patch("/hospitals/:id", authenticate, authorize("SuperAdmin"), updateHospital);
router.get("/users", authenticate, authorize("SuperAdmin"), getAllUsers);
router.patch("/users/:userId/toggle", authenticate, authorize("SuperAdmin"), deactivateUser);
router.get("/stats", authenticate, authorize("SuperAdmin"), getSystemStats);

export default router;
