/**
 * Photo service — manages partner-uploaded photos on disk.
 *
 * Uses base64 JSON payloads (no multer) and writes files directly.
 * Thumbnails are generated client-side and sent alongside the full image.
 */

import fs from "node:fs";
import path from "node:path";
import type { PhotoOption } from "@shared/types";

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

export class PhotoService {
  private nextId = 1;

  constructor(private readonly uploadsRoot: string) {}

  // ── Public API ──────────────────────────────────────────────────────────

  upload(
    ticketId: string,
    imageData: string,
    thumbnailData: string,
    fileName: string,
  ): PhotoOption {
    this.validateFileName(fileName);

    const photoId = this.generateId(ticketId);
    const safeName = `${photoId}${path.extname(fileName)}`;

    const ticketDir = path.join(this.uploadsRoot, ticketId);
    const thumbDir = path.join(ticketDir, "thumbnails");
    fs.mkdirSync(thumbDir, { recursive: true });

    const imagePath = path.join(ticketDir, safeName);
    const thumbPath = path.join(thumbDir, safeName);

    fs.writeFileSync(imagePath, Buffer.from(imageData, "base64"));
    fs.writeFileSync(thumbPath, Buffer.from(thumbnailData, "base64"));

    return {
      id: photoId,
      label: fileName,
      fileName: safeName,
      imageUrl: `/api/assets/uploads/${encodeURIComponent(ticketId)}/${encodeURIComponent(safeName)}`,
      thumbnailUrl: `/api/assets/uploads/${encodeURIComponent(ticketId)}/thumbnails/${encodeURIComponent(safeName)}`,
    };
  }

  /** Delete uploaded image and thumbnail files from disk. */
  deleteFiles(ticketId: string, fileName: string): void {
    const ticketDir = path.join(this.uploadsRoot, ticketId);
    const imagePath = path.join(ticketDir, fileName);
    const thumbPath = path.join(ticketDir, "thumbnails", fileName);

    this.safeUnlink(imagePath);
    this.safeUnlink(thumbPath);
  }

  // ── Private ─────────────────────────────────────────────────────────────

  private generateId(ticketId: string): string {
    const id = `upload-${ticketId}-${this.nextId}`;
    this.nextId += 1;
    return id;
  }

  private validateFileName(fileName: string): void {
    const ext = path.extname(fileName).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      throw new Error(
        `Unsupported file type: ${ext}. Allowed: ${[...ALLOWED_EXTENSIONS].join(", ")}`,
      );
    }
  }

  private safeUnlink(filePath: string): void {
    try {
      fs.unlinkSync(filePath);
    } catch {
      // File may already be removed — ignore.
    }
  }
}
