import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { downloadPrescription } from "../controllers/pdf.controller";

const router = Router();
router.get("/prescription/:id", authenticate, downloadPrescription);

export default router;
