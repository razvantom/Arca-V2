import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import { extname, join } from "path";
import { DEFAULT_UPLOADS_DIR } from "../../config/uploads.config";
import { DOCUMENT_MIME_TYPE_EXTENSIONS } from "./dto/create-document.dto";

export interface StoredFile {
  fileUrl: string;
  mimeType: string;
  sizeBytes: number;
}

export interface UploadFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size?: number;
}

@Injectable()
export class StorageService {
  constructor(private config: ConfigService) {}

  getUploadsDir() {
    return this.config.get<string>("uploads.dir") || DEFAULT_UPLOADS_DIR;
  }

  getPublicPath() {
    return "/uploads";
  }

  async saveFile(file: UploadFile): Promise<StoredFile> {
    if (!file) throw new BadRequestException("File is required");
    if (!file.buffer) throw new BadRequestException("Invalid file payload");

    const uploadsDir = this.getUploadsDir();

    await fs.mkdir(uploadsDir, { recursive: true });

    const rawExtension = extname(file.originalname).toLowerCase();
    const allowedExtensions =
      DOCUMENT_MIME_TYPE_EXTENSIONS[
        file.mimetype as keyof typeof DOCUMENT_MIME_TYPE_EXTENSIONS
      ] ?? [];
    if (rawExtension && !allowedExtensions.includes(rawExtension)) {
      throw new BadRequestException("File extension does not match MIME type");
    }
    const safeExtension = rawExtension || allowedExtensions[0] || "";
    const filename = `${randomUUID()}${safeExtension}`;
    const targetPath = join(uploadsDir, filename);

    const tempPath = join(uploadsDir, `${filename}.tmp`);
    try {
      await fs.writeFile(tempPath, file.buffer);
      await fs.rename(tempPath, targetPath);
    } catch (error) {
      await fs.rm(tempPath, { force: true });
      throw error;
    }

    return {
      fileUrl: `${this.getPublicPath()}/${filename}`,
      mimeType: file.mimetype,
      sizeBytes: file.size ?? file.buffer.length,
    };
  }
}
