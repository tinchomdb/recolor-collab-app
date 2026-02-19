/**
 * Image utilities for client-side photo processing.
 *
 * Converts File objects to base64 and generates thumbnails
 * using an offscreen canvas — no server-side dependencies needed.
 */

const DEFAULT_THUMBNAIL_MAX_WIDTH = 200;

/** Read a File as a base64 string (without the data: prefix). */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      if (!base64) {
        reject(new Error("Failed to read file as base64"));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/** Generate a resized thumbnail as a base64 string using a canvas. */
export function generateThumbnail(
  file: File,
  maxWidth = DEFAULT_THUMBNAIL_MAX_WIDTH,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const scale = Math.min(1, maxWidth / img.width);
      const width = Math.round(img.width * scale);
      const height = Math.round(img.height * scale);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context unavailable"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      const dataUrl = canvas.toDataURL(file.type || "image/jpeg", 0.8);
      const base64 = dataUrl.split(",")[1];
      if (!base64) {
        reject(new Error("Failed to generate thumbnail"));
        return;
      }
      resolve(base64);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image for thumbnail"));
    };

    img.src = url;
  });
}
