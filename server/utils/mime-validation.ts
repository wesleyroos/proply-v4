import fs from "fs";

const IMAGE_MAGIC_BYTES: Array<{ bytes: number[]; mask?: number[]; offset?: number }> = [
  { bytes: [0xFF, 0xD8, 0xFF] },                                          // JPEG
  { bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] },          // PNG
  { bytes: [0x47, 0x49, 0x46, 0x38] },                                    // GIF (GIF8)
  { bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 },                        // WebP part 1 (RIFF)
];

function matchesSignature(buf: Buffer, sig: (typeof IMAGE_MAGIC_BYTES)[number]): boolean {
  const off = sig.offset ?? 0;
  for (let i = 0; i < sig.bytes.length; i++) {
    if (buf[off + i] !== sig.bytes[i]) return false;
  }
  return true;
}

function isWebP(buf: Buffer): boolean {
  // RIFF at 0-3, WEBP at 8-11
  if (buf.length < 12) return false;
  return (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  );
}

export function isValidImageFile(filePath: string): boolean {
  try {
    const buf = Buffer.alloc(12);
    const fd = fs.openSync(filePath, "r");
    fs.readSync(fd, buf, 0, 12, 0);
    fs.closeSync(fd);

    if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return true;           // JPEG
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return true; // PNG
    if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return true; // GIF
    if (isWebP(buf)) return true;                                                       // WebP

    return false;
  } catch {
    return false;
  }
}
