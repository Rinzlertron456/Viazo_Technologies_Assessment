import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import authRoutes from "./routes/auth.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import patientRoutes from "./routes/patient.routes";
import doctorRoutes from "./routes/doctor.routes";
import receptionistRoutes from "./routes/receptionist.routes";
import adminRoutes from "./routes/admin.routes";
import reviewRoutes from "./routes/review.routes";
import reportsRoutes from "./routes/reports.routes";
import uploadRoutes from "./routes/upload.routes";
import paymentRoutes from "./routes/payment.routes";
import calendarRoutes from "./routes/calendar.routes";
import licenseRoutes from "./routes/license.routes";
import pdfRoutes from "./routes/pdf.routes";
import sessionRoutes from "./routes/session.routes";
import superadminRoutes from "./routes/superadmin.routes";
import pharmacyRoutes from "./routes/pharmacy.routes";
import path from "path";

const app = express();

// Trust proxy — required for express-rate-limit behind Cloud Run's load balancer
app.set('trust proxy', true);

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:"],
        fontSrc: ["'self'"],
        connectSrc: ["'self'", env.CLIENT_URL],
        frameSrc: ["'none'"],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        ...(process.env.NODE_ENV === "production"
          ? { upgradeInsecureRequests: [] }
          : {}),
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
);

// CORS
// Allow the configured client URL, localhost (dev), any explicitly listed
// origin, and ANY Vercel deployment of this app (production + previews). The
// live frontend is served from a *.vercel.app domain that differs from
// CLIENT_URL, so hard-coding a single origin previously blocked every API
// call (CORS error, stats not loading, Google auth failing).
const allowedOrigins = new Set<string>(
  [
    "http://localhost:5173",
    env.CLIENT_URL,
    ...(process.env.CORS_ALLOWED_ORIGINS
      ? process.env.CORS_ALLOWED_ORIGINS.split(",").map((o) => o.trim())
      : []),
  ].filter(Boolean) as string[],
);

const isOriginAllowed = (origin: string | undefined): boolean => {
  if (!origin) return false;
  if (allowedOrigins.has(origin)) return true;
  // Accept any Vercel deployment of this project (e.g. medibook-gilt-woad.vercel.app
  // and preview deploys), so the frontend is never CORS-blocked.
  return /^https:\/\/([\w-]+\.)*vercel\.app$/.test(origin);
};

app.use(
  cors({
    origin: (origin, callback) => {
      // Requests without an Origin header (curl, health checks, server-to-server)
      // are permitted.
      if (!origin) return callback(null, true);
      if (isOriginAllowed(origin)) return callback(null, true);
      callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Global rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});
app.use("/api/", limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: {
    success: false,
    message: "Too many login/register attempts, please try again later.",
  },
});
// Strict auth limiting is enforced in production; dev/test environments create
// many accounts through the UI (see testing.md), so it is disabled there.
if (process.env.NODE_ENV === "production") {
  app.use("/api/auth/login", authLimiter);
  app.use("/api/auth/register", authLimiter);
  app.use("/api/auth/forgot-password", authLimiter);
}

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/patient", patientRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/receptionist", receptionistRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin/reports", reportsRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/admin/license", licenseRoutes);
app.use("/api/pdf", pdfRoutes);
app.use("/api/session", sessionRoutes);
app.use("/api/super-admin", superadminRoutes);
app.use("/api/pharmacy", pharmacyRoutes);

// Static files for uploads
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;
