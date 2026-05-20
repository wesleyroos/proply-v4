import fs from "fs";
import path from "path";

function readMagicBytes(filePath: string): Buffer {
  const buf = Buffer.alloc(12);
  const fd = fs.openSync(filePath, "r");
  fs.readSync(fd, buf, 0, 12, 0);
  fs.closeSync(fd);
  return buf;
}

function isWebP(buf: Buffer): boolean {
  return (
    buf.length >= 12 &&
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  );
}

export function isValidImageFile(filePath: string): boolean {
  try {
    const buf = readMagicBytes(filePath);
    if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return true; // JPEG
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return true; // PNG
    if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return true; // GIF
    if (isWebP(buf)) return true; // WebP
    return false;
  } catch {
    return false;
  }
}

/** Returns a safe canonical extension (.jpg/.png/.gif/.webp) based on actual file content. */
export function safeImageExtension(filePath: string): string {
  try {
    const buf = readMagicBytes(filePath);
    if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return ".jpg";
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return ".png";
    if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return ".gif";
    if (isWebP(buf)) return ".webp";
  } catch { /* fall through */ }
  return ".jpg";
}

