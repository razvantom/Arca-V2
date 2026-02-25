import { registerAs } from "@nestjs/config";
import { join } from "path";

export const DEFAULT_UPLOADS_DIR = join(process.cwd(), "uploads");

export const uploadsConfig = registerAs("uploads", () => ({
  dir: process.env.UPLOADS_DIR || DEFAULT_UPLOADS_DIR,
}));
