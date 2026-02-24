import { Controller, Get, Post, Param, Query, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { MembershipsService, UserContext } from "./memberships.service";
import { ListMembershipsDto } from "./dto/list-memberships.dto";
import { AuthGuard } from "../../common/guards/auth.guard";
import { ScopeGuard } from "../../common/guards/scope.guard";

@UseGuards(AuthGuard, ScopeGuard)
@Controller("/api/v1/memberships")
export class MembershipsController {
  constructor(private memberships: MembershipsService) {}

  @Get()
  list(@Req() req: Request, @Query() filters: ListMembershipsDto) {
    return this.memberships.list((req as any).user as UserContext, filters);
  }

  @Post(":id/approve")
  approve(@Param("id") id: string, @Req() req: Request) {
    return this.memberships.approve(id, (req as any).user as UserContext);
  }

  @Post(":id/reject")
  reject(@Param("id") id: string, @Req() req: Request) {
    return this.memberships.reject(id, (req as any).user as UserContext);
  }

  @Post(":id/suspend")
  suspend(@Param("id") id: string, @Req() req: Request) {
    return this.memberships.suspend(id, (req as any).user as UserContext);
  }
}
