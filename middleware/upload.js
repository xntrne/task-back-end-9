import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import multer from "multer";

export const uploadDirectory = path.join(import.meta.dirname, "..", "uploads");

fs.mkdirSync(uploadDirectory, { recursive: true });

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadDirectory);
  },
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${randomUUID()}${extension}`);
  },
});

const fileFilter = (_req, file, callback) => {
  const extension = path.extname(file.originalname).toLowerCase();
  const isImage = file.mimetype.startsWith("image/") && ALLOWED_EXTENSIONS.has(extension);

  if (!isImage) {
    const error = new Error("image must be a jpg, jpeg, png, webp or gif file");
    error.status = 422;
    error.field = file.fieldname;
    return callback(error);
  }

  callback(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

export function removeUploadedFile(filename) {
  if (!filename) return;

  // basename() prevents path traversal outside the uploads folder.
  const filePath = path.join(uploadDirectory, path.basename(filename));

  fs.promises.unlink(filePath).catch(() => {});
}

export function cleanupUploadedFiles(req) {
  if (req.file) removeUploadedFile(req.file.filename);

  if (Array.isArray(req.files)) {
    req.files.forEach((file) => removeUploadedFile(file.filename));
  }
}
