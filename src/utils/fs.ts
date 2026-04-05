import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname } from "path";

export function ensureDir(path: string): void {
  const dir = dirname(path);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

export function readJson<T>(path: string): T | null {
  try {
    if (!existsSync(path)) return null;
    const data = readFileSync(path, "utf-8");
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
}

export function writeJson<T>(path: string, data: T): void {
  ensureDir(path);
  writeFileSync(path, JSON.stringify(data, null, 2), "utf-8");
}
