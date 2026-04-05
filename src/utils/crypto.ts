import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;

function deriveKey(key: string): Buffer {
  return Buffer.alloc(KEY_LENGTH, key.padEnd(KEY_LENGTH, "0").slice(0, KEY_LENGTH));
}

export function encrypt(text: string, apiKey: string): string {
  const key = deriveKey(apiKey);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const tag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted}`;
}

export function decrypt(cipher: string, apiKey: string): string {
  const parts = cipher.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid cipher format");
  }

  const [ivHex, tagHex, encrypted] = parts;
  const key = deriveKey(apiKey);
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
