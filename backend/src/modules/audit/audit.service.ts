import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

type AuditLogInput = {
  actorUserId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  scopeType: string | null;
  countyId: number | null;
  organizationId: number | null;
  meta: any;
};

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(input: AuditLogInput) {
    return this.prisma.auditLog.create({
      data: {
        actorUserId: input.actorUserId,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        scopeType: input.scopeType,
        countyId: input.countyId,
        organizationId: input.organizationId,
        meta: input.meta,
      },
    });
  }
}
