import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { getCalendarAppointments } from "../controllers/calendar.controller";

const router = Router();
router.get("/", authenticate, getCalendarAppointments);

export default router;
