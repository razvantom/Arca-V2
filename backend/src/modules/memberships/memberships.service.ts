import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { ListMembershipsDto } from "./dto/list-memberships.dto";

export interface UserContext {
  id: string;
  roles: string[];
  scope: {
    type: "GLOBAL" | "COUNTY" | "ORG" | "SELF";
    countyId?: number;
    organizationId?: number;
  };
}

@Injectable()
export class MembershipsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  private buildScopeWhere(actor: UserContext, extraFilters: { organizationId?: number; countyId?: number }) {
    const { scope } = actor;

    if (scope.type === "GLOBAL") {
      return {
        ...(extraFilters.organizationId ? { organizationId: extraFilters.organizationId } : {}),
        ...(extraFilters.countyId ? { organization: { countyId: extraFilters.countyId } } : {}),
      };
    }

    if (scope.type === "COUNTY") {
      if (!scope.countyId) throw new ForbiddenException("Missing county context");
      return {
        organization: { countyId: scope.countyId },
        ...(extraFilters.organizationId ? { organizationId: extraFilters.organizationId } : {}),
      };
    }

    if (scope.type === "ORG") {
      if (!scope.organizationId) throw new ForbiddenException("Missing organization context");
      return { organizationId: scope.organizationId };
    }

    // SELF scope — only own membership
    return { userId: actor.id };
  }

  async list(actor: UserContext, filters: ListMembershipsDto) {
    const where = {
      ...this.buildScopeWhere(actor, {
        organizationId: filters.organizationId,
        countyId: filters.countyId,
      }),
      ...(filters.status ? { status: filters.status } : {}),
    };

    const memberships = await this.prisma.membership.findMany({
      where,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        organization: { select: { id: true, name: true, countyId: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { appliedAt: "desc" },
    });

    await this.audit.log({
      actorUserId: actor.id,
      action: "MEMBERSHIP_LIST",
      entity: "Membership",
      entityId: null,
      scopeType: actor.scope.type,
      countyId: actor.scope.countyId ?? null,
      organizationId: actor.scope.organizationId ?? null,
      meta: { filters },
    });

    return memberships;
  }

  async approve(id: string, actor: UserContext) {
    if (actor.scope.type === "SELF") {
      throw new ForbiddenException("SELF scope cannot approve memberships");
    }

    const membership = await this.prisma.membership.findUnique({
      where: { id },
      include: { organization: { select: { countyId: true } } },
    });
    if (!membership) throw new NotFoundException("Membership not found");

    if (membership.userId === actor.id) {
      throw new ForbiddenException("Cannot approve your own membership");
    }

    this.assertScopeCovers(actor, membership.organizationId, membership.organization.countyId);

    const memberRole = await this.prisma.role.findUnique({ where: { key: "MEMBER" } });
    if (!memberRole) throw new NotFoundException("MEMBER role not found. Run seed.");

    const updated = await this.prisma.membership.update({
      where: { id },
      data: {
        status: "ACTIVE",
        approvedAt: new Date(),
        approvedById: actor.id,
      },
    });

    // Assign MEMBER role (idempotent – skip if already present)
    const existingMember = await this.prisma.accessAssignment.findFirst({
      where: { userId: membership.userId, roleId: memberRole.id, endAt: null },
    });
    if (!existingMember) {
      await this.prisma.accessAssignment.create({
        data: { userId: membership.userId, roleId: memberRole.id },
      });
    }

    await this.audit.log({
      actorUserId: actor.id,
      action: "MEMBERSHIP_APPROVE",
      entity: "Membership",
      entityId: id,
      scopeType: actor.scope.type,
      countyId: actor.scope.countyId ?? null,
      organizationId: actor.scope.organizationId ?? null,
      meta: { membershipUserId: membership.userId, organizationId: membership.organizationId },
    });

    return updated;
  }

  async reject(id: string, actor: UserContext) {
    if (actor.scope.type === "SELF") {
      throw new ForbiddenException("SELF scope cannot reject memberships");
    }

    const membership = await this.prisma.membership.findUnique({
      where: { id },
      include: { organization: { select: { countyId: true } } },
    });
    if (!membership) throw new NotFoundException("Membership not found");

    this.assertScopeCovers(actor, membership.organizationId, membership.organization.countyId);

    const updated = await this.prisma.membership.update({
      where: { id },
      data: { status: "REJECTED" },
    });

    await this.audit.log({
      actorUserId: actor.id,
      action: "MEMBERSHIP_REJECT",
      entity: "Membership",
      entityId: id,
      scopeType: actor.scope.type,
      countyId: actor.scope.countyId ?? null,
      organizationId: actor.scope.organizationId ?? null,
      meta: { membershipUserId: membership.userId, organizationId: membership.organizationId },
    });

    return updated;
  }

  async suspend(id: string, actor: UserContext) {
    if (actor.scope.type === "SELF") {
      throw new ForbiddenException("SELF scope cannot suspend memberships");
    }

    const membership = await this.prisma.membership.findUnique({
      where: { id },
      include: { organization: { select: { countyId: true } } },
    });
    if (!membership) throw new NotFoundException("Membership not found");

    this.assertScopeCovers(actor, membership.organizationId, membership.organization.countyId);

    const updated = await this.prisma.membership.update({
      where: { id },
      data: { status: "SUSPENDED" },
    });

    await this.audit.log({
      actorUserId: actor.id,
      action: "MEMBERSHIP_SUSPEND",
      entity: "Membership",
      entityId: id,
      scopeType: actor.scope.type,
      countyId: actor.scope.countyId ?? null,
      organizationId: actor.scope.organizationId ?? null,
      meta: { membershipUserId: membership.userId, organizationId: membership.organizationId },
    });

    return updated;
  }

  private assertScopeCovers(actor: UserContext, organizationId: number, countyId: number) {
    const { scope } = actor;
    if (scope.type === "GLOBAL") return;
    if (scope.type === "COUNTY") {
      if (scope.countyId !== countyId) {
        throw new ForbiddenException("Access denied: membership belongs to a different county");
      }
      return;
    }
    if (scope.type === "ORG") {
      if (scope.organizationId !== organizationId) {
        throw new ForbiddenException("Access denied: membership belongs to a different organization");
      }
      return;
    }
    throw new ForbiddenException("Insufficient scope");
  }
}
