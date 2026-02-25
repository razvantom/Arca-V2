import { IsEnum, IsInt, IsOptional, IsString, Min } from "class-validator";
import { Type } from "class-transformer";
import { DocumentScopeType } from "./create-document.dto";

export class ListDocumentsDto {
  @IsOptional()
  @IsString()
  category?: string;

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

  @IsOptional()
  @IsString()
  createdByUserId?: string;
}
