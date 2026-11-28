import multer from "multer";
import type { Request, Response, NextFunction } from "express";

export const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2 MB in bytes
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const upload = multer({
  // Keep the file in memory first, so we can CHECK it before saving it to disk
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_SIZE, files: 1 },
  fileFilter: (_req, file, callback) => {
    // Wrong type → skip the file (req.file stays empty; the route then explains)
    callback(null, ALLOWED_TYPES.includes(file.mimetype));
  },
});

// Reads ONE photo from the form field "image".
// Turns multer's errors into friendly 400 messages instead of a 500.
export function uploadImage(req: Request, res: Response, next: NextFunction) {
  upload.single("image")(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        res.status(400).json({ error: "The photo must be 2 MB or smaller" });
        return;
      }
      res.status(400).json({ error: 'Please send ONE photo in the "image" field' });
      return;
    }
    if (err) {
      next(err); // a real crash → our 500 error handler
      return;
    }
    next(); // ✅ the photo (if any) is now in req.file
  });
}