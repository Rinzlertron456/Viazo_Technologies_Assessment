import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { checkSession } from "../controllers/session.controller";

const router = Router();
router.get("/check", authenticate, checkSession);

export default router;
