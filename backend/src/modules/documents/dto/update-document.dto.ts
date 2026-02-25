import { IsEnum, IsIn, IsInt, IsOptional, IsString, Matches, Min } from "class-validator";
import { Type } from "class-transformer";
import { ALLOWED_DOCUMENT_MIME_TYPES, DocumentScopeType } from "./create-document.dto";

export class UpdateDocumentDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\/uploads\//, { message: "fileUrl must come from upload endpoint" })
  fileUrl?: string;

  @IsOptional()
  @IsString()
  @IsIn(ALLOWED_DOCUMENT_MIME_TYPES)
  mimeType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sizeBytes?: number;

  @IsOptional()
  @IsEnum(DocumentScopeType)
  scopeType?: DocumentScopeType;

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
