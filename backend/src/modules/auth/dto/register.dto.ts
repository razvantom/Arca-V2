import { IsEmail, IsInt, IsOptional, IsString, Min } from "class-validator";

export class RegisterDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  password!: string;

  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsInt()
  @Min(1)
  countyId!: number;

  @IsInt()
  @Min(1)
  organizationId!: number;

  @IsInt()
  @Min(1)
  localityId!: number;

  @IsInt()
  @Min(1)
  pollingSectionId!: number;
}
