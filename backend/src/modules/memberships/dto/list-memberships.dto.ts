import { IsEnum, IsOptional, IsInt, Min } from "class-validator";
import { Type } from "class-transformer";

export enum MembershipStatusFilter {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  REJECTED = "REJECTED",
  SUSPENDED = "SUSPENDED",
}

export class ListMembershipsDto {
  @IsOptional()
  @IsEnum(MembershipStatusFilter)
  status?: MembershipStatusFilter;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  organizationId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  countyId?: number;
}
