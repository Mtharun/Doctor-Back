import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { ApiError } from "../utils/ApiError.js";

// Accepts images and PDFs only, up to 10MB, and stores them on disk under
// /uploads/<folder>/. Filenames are randomized so users can't overwrite
// each other's files or guess another patient's file name.
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

function makeUploader(folder) {
  const dest = path.join(process.cwd(), "uploads", folder);
  fs.mkdirSync(dest, { recursive: true });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, dest),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, unique);
    },
  });

  return multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (!ALLOWED_MIME.has(file.mimetype)) {
        return cb(new ApiError(400, "Only JPG, PNG, WEBP images or PDF files are allowed."));
      }
      cb(null, true);
    },
  });
}

export const uploadReport = makeUploader("reports");
export const uploadEmergencyImage = makeUploader("emergency");
