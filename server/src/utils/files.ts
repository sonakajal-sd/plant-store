import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

// server/uploads (this file is in server/src/utils, so go up 2 folders)
export const UPLOADS_DIR = path.join(import.meta.dirname, "..", "..", "uploads");
export const PRODUCT_IMAGES_DIR = path.join(UPLOADS_DIR, "products");

// The web address where the photos are served, e.g. /uploads/products/abc.jpg
export const PRODUCT_IMAGES_URL = "/uploads/products";

// Create the folders when the server starts (does nothing if they already exist)
export async function ensureUploadFolders() {
  await fs.mkdir(PRODUCT_IMAGES_DIR, { recursive: true });
}

type ImageType = { ext: string };

// Looks at the FIRST BYTES of the file ("magic numbers") to see what it really is.
// A renamed file (virus.exe → photo.jpg) still has the wrong first bytes, so it fails here.
export function detectImageType(buffer: Buffer): ImageType | null {
  // JPG starts with: FF D8 FF
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { ext: "jpg" };
  }

  // PNG starts with: 89 50 4E 47 0D 0A 1A 0A
  const pngStart = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (buffer.length >= 8 && pngStart.every((byte, i) => buffer[i] === byte)) {
    return { ext: "png" };
  }

  // WEBP starts with: "RIFF" (4 bytes), the size (4 bytes), then "WEBP"
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return { ext: "webp" };
  }

  return null; // not a JPG, PNG or WEBP
}

// Saves the photo with a RANDOM name (never the user's file name) and returns its web address
export async function saveProductImage(buffer: Buffer, ext: string): Promise<string> {
  const fileName = `${crypto.randomUUID()}.${ext}`;
  await fs.writeFile(path.join(PRODUCT_IMAGES_DIR, fileName), buffer);
  return `${PRODUCT_IMAGES_URL}/${fileName}`;
}

// Deletes a photo file. Does nothing if there is no photo or the file is already gone.
export async function deleteProductImage(imageUrl: string | null): Promise<void> {
  if (!imageUrl || !imageUrl.startsWith(PRODUCT_IMAGES_URL + "/")) return;

  // basename keeps only the file name, so tricks like "../../.env" can't escape the folder
  const fileName = path.basename(imageUrl);

  try {
    await fs.unlink(path.join(PRODUCT_IMAGES_DIR, fileName));
  } catch {
    // The file was already deleted → that's fine
  }
}