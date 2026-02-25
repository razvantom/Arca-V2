import { DocumentScopeType } from "@prisma/client";
import { Type } from "class-transformer";
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Matches, Min } from "class-validator";

export { DocumentScopeType };

export const ALLOWED_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
] as const;
export const DOCUMENT_MIME_TYPE_EXTENSIONS: Record<(typeof ALLOWED_DOCUMENT_MIME_TYPES)[number], string[]> =
  {
    "application/pdf": [".pdf"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    "image/png": [".png"],
    "image/jpeg": [".jpg", ".jpeg"],
  };
export const UPLOADS_UUID_FILE_URL_REGEX =
  /^\/uploads\/[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}(\.[a-z0-9]+)?$/;

export class CreateDocumentDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  category!: string;

  @IsString()
  @Matches(UPLOADS_UUID_FILE_URL_REGEX, { message: "fileUrl must reference an uploaded file" })
  fileUrl!: string;

  @IsString()
  @IsIn(ALLOWED_DOCUMENT_MIME_TYPES)
  mimeType!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  sizeBytes!: number;

  @IsEnum(DocumentScopeType)
  scopeType!: DocumentScopeType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  countyId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  organizationId?: number;
}
