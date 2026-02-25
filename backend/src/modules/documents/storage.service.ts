import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import { extname, join } from "path";
import { DEFAULT_UPLOADS_DIR } from "../../config/uploads.config";

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

    const extension = extname(file.originalname);
    const filename = `${randomUUID()}${extension}`;
    const targetPath = join(uploadsDir, filename);

    await fs.writeFile(targetPath, file.buffer);

    return {
      fileUrl: `${this.getPublicPath()}/${filename}`,
      mimeType: file.mimetype,
      sizeBytes: file.buffer.length,
    };
  }
}
