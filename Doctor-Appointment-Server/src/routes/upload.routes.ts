import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { authenticate } from "../middleware/auth";
import { env } from "../config/env";

// ── Storage Strategy ─────────────────────────────────────────────────────────────
// If GCS_BUCKET_NAME env var is set, use memory storage and upload to GCS
// in the handler. Otherwise, fall back to local disk (dev).

const useGcs = Boolean(env.GCS_BUCKET_NAME);
let storage: multer.StorageEngine;

if (useGcs) {
  storage = multer.memoryStorage();
} else {
  // Local disk storage (dev fallback)
  const uploadDir = path.join(__dirname, "..", "..", "uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
      const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, unique + path.extname(file.originalname));
    },
  });
}

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext || mime) cb(null, true);
    else cb(new Error("Only images, PDFs, and documents are allowed"));
  },
});

const router = Router();

router.post(
  "/",
  authenticate,
  upload.single("file"),
  async (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({ success: false, message: "No file uploaded" });
      return;
    }

    let url: string;

    if (useGcs) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { Storage } = require("@google-cloud/storage");
        const gcs = new Storage({ projectId: env.GCP_PROJECT_ID || undefined });
        const bucket = gcs.bucket(env.GCS_BUCKET_NAME);

        const blobName =
          Date.now() + "-" + path.basename(req.file.originalname);
        const blob = bucket.file(blobName);

        const stream = blob.createWriteStream({
          resumable: false,
          contentType: req.file.mimetype,
          public: true,
        });

        await new Promise<void>((resolve, reject) => {
          stream.on("error", reject);
          stream.on("finish", resolve);
          stream.end(req.file!.buffer);
        });

        url = `https://storage.googleapis.com/${env.GCS_BUCKET_NAME}/${blobName}`;
      } catch (error) {
        console.error("[UPLOAD] GCS upload failed:", error);
        res.status(500).json({ success: false, message: "File upload failed" });
        return;
      }
    } else {
      url = `/uploads/${req.file.filename}`;
    }

    res.json({ success: true, data: { url } });
  },
);

export default router;
