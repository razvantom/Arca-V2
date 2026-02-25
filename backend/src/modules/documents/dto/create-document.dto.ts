import { DocumentScopeType } from "@prisma/client";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsString, Min } from "class-validator";

export { DocumentScopeType };

export class CreateDocumentDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  category!: string;

  @IsString()
  fileUrl!: string;

  @IsString()
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
