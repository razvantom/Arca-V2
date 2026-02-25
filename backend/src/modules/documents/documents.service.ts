import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { CreateDocumentDto, DocumentScopeType } from "./dto/create-document.dto";
import { UpdateDocumentDto } from "./dto/update-document.dto";
import { ListDocumentsDto } from "./dto/list-documents.dto";

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
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  private async resolveActorCountyId(actor: UserContext) {
    if (actor.scope.type === "COUNTY") {
      if (!actor.scope.countyId) throw new ForbiddenException("Missing county context");
      return actor.scope.countyId;
    }

    if (actor.scope.type === "ORG") {
      if (!actor.scope.organizationId) throw new ForbiddenException("Missing organization context");
      const org = await this.prisma.organization.findUnique({
        where: { id: actor.scope.organizationId },
        select: { countyId: true },
      });
      if (!org) throw new ForbiddenException("Missing organization context");
      return org.countyId;
    }

    return null;
  }

  private async resolveOrganizationCountyId(organizationId: number) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { countyId: true },
    });
    if (!org) throw new NotFoundException("Organization not found");
    return org.countyId;
  }

  private async buildScopeWhere(actor: UserContext) {
    const { scope } = actor;

    if (scope.type === "GLOBAL") {
      return {};
    }

    if (scope.type === "COUNTY") {
      if (!scope.countyId) throw new ForbiddenException("Missing county context");
      return {
        OR: [
          { scopeType: "GLOBAL" },
          { scopeType: "COUNTY", countyId: scope.countyId },
          { scopeType: "ORG", organization: { countyId: scope.countyId } },
        ],
      };
    }

    if (scope.type === "ORG") {
      if (!scope.organizationId) throw new ForbiddenException("Missing organization context");
      const countyId = await this.resolveActorCountyId(actor);
      const orClauses: Array<Record<string, any>> = [
        { scopeType: "GLOBAL" },
        { scopeType: "ORG", organizationId: scope.organizationId },
      ];
      if (countyId != null) {
        orClauses.push({ scopeType: "COUNTY", countyId });
      }
      return { OR: orClauses };
    }

    return {
      OR: [{ scopeType: "GLOBAL" }, { createdByUserId: actor.id }],
    };
  }

  private buildFilters(filters: ListDocumentsDto) {
    return {
      ...(filters.category ? { category: filters.category } : {}),
      ...(filters.scopeType ? { scopeType: filters.scopeType } : {}),
      ...(filters.countyId ? { countyId: filters.countyId } : {}),
      ...(filters.organizationId ? { organizationId: filters.organizationId } : {}),
      ...(filters.createdByUserId ? { createdByUserId: filters.createdByUserId } : {}),
    };
  }

  private combineWhere(scopeWhere: Record<string, any>, filtersWhere: Record<string, any>) {
    if (Object.keys(filtersWhere).length === 0) return scopeWhere;
    if (Object.keys(scopeWhere).length === 0) return filtersWhere;
    return { AND: [scopeWhere, filtersWhere] };
  }

  private async assertCanView(actor: UserContext, document: any) {
    if (document.createdByUserId === actor.id) return;
    if (document.scopeType === "GLOBAL") return;
    if (actor.scope.type === "GLOBAL") return;

    if (actor.scope.type === "COUNTY") {
      if (!actor.scope.countyId) throw new ForbiddenException("Missing county context");
      if (document.scopeType === "COUNTY" && document.countyId === actor.scope.countyId) return;
      if (document.scopeType === "ORG" && document.organization?.countyId === actor.scope.countyId) {
        return;
      }
      throw new ForbiddenException("Access denied: document out of scope");
    }

    if (actor.scope.type === "ORG") {
      if (!actor.scope.organizationId) throw new ForbiddenException("Missing organization context");
      if (document.scopeType === "ORG" && document.organizationId === actor.scope.organizationId) {
        return;
      }
      if (document.scopeType === "COUNTY") {
        const countyId = await this.resolveActorCountyId(actor);
        if (countyId != null && document.countyId === countyId) return;
      }
      throw new ForbiddenException("Access denied: document out of scope");
    }

    if (actor.scope.type === "SELF" && document.createdByUserId !== actor.id) {
      throw new ForbiddenException("Access denied: document out of scope");
    }
  }

  private async assertCanManage(actor: UserContext, document: any) {
    if (document.createdByUserId === actor.id) return;
    if (actor.scope.type === "GLOBAL") return;
    if (actor.scope.type === "SELF") {
      throw new ForbiddenException("Insufficient scope to manage documents");
    }
    if (document.scopeType === "GLOBAL") {
      throw new ForbiddenException("Access denied: document out of scope");
    }

    if (actor.scope.type === "COUNTY") {
      if (!actor.scope.countyId) throw new ForbiddenException("Missing county context");
      if (document.scopeType === "COUNTY" && document.countyId === actor.scope.countyId) return;
      if (document.scopeType === "ORG" && document.organization?.countyId === actor.scope.countyId) {
        return;
      }
      throw new ForbiddenException("Access denied: document out of scope");
    }

    if (actor.scope.type === "ORG") {
      if (!actor.scope.organizationId) throw new ForbiddenException("Missing organization context");
      if (document.scopeType === "ORG" && document.organizationId === actor.scope.organizationId) {
        return;
      }
      throw new ForbiddenException("Access denied: document out of scope");
    }
  }

  private async assertScopeInput(
    actor: UserContext,
    scopeType: DocumentScopeType,
    countyId?: number,
    organizationId?: number,
  ) {
    if (actor.scope.type === "SELF") {
      throw new ForbiddenException("Insufficient scope to manage documents");
    }

    if (scopeType === "GLOBAL") {
      if (actor.scope.type !== "GLOBAL") {
        throw new ForbiddenException("Access denied: global scope required");
      }
      return;
    }

    if (scopeType === "COUNTY") {
      if (!countyId) throw new BadRequestException("countyId is required for COUNTY scope");
      if (actor.scope.type === "GLOBAL") return;
      if (actor.scope.type === "COUNTY") {
        if (actor.scope.countyId === countyId) return;
        throw new ForbiddenException("Access denied: county scope mismatch");
      }
      if (actor.scope.type === "ORG") {
        const actorCountyId = await this.resolveActorCountyId(actor);
        if (actorCountyId === countyId) return;
      }
      throw new ForbiddenException("Access denied: county scope mismatch");
    }

    if (scopeType === "ORG") {
      if (!organizationId) {
        throw new BadRequestException("organizationId is required for ORG scope");
      }
      if (actor.scope.type === "GLOBAL") return;
      if (actor.scope.type === "ORG") {
        if (actor.scope.organizationId === organizationId) return;
        throw new ForbiddenException("Access denied: organization scope mismatch");
      }
      if (actor.scope.type === "COUNTY") {
        if (!actor.scope.countyId) throw new ForbiddenException("Missing county context");
        const orgCountyId = await this.resolveOrganizationCountyId(organizationId);
        if (orgCountyId === actor.scope.countyId) return;
      }
      throw new ForbiddenException("Access denied: organization scope mismatch");
    }

    throw new BadRequestException("Invalid scope type");
  }

  async list(actor: UserContext, filters: ListDocumentsDto) {
    const scopeWhere = await this.buildScopeWhere(actor);
    const filtersWhere = this.buildFilters(filters);
    const where = this.combineWhere(scopeWhere, filtersWhere);

    const documents = await this.prisma.document.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    await this.audit.log({
      actorUserId: actor.id,
      action: "DOCUMENT_LIST",
      entity: "Document",
      entityId: null,
      scopeType: actor.scope.type,
      countyId: actor.scope.countyId ?? null,
      organizationId: actor.scope.organizationId ?? null,
      meta: { filters },
    });

    return documents;
  }

  async get(id: string, actor: UserContext) {
    const document = await this.prisma.document.findUnique({
      where: { id },
      include: { organization: { select: { countyId: true } } },
    });
    if (!document) throw new NotFoundException("Document not found");

    await this.assertCanView(actor, document);

    await this.audit.log({
      actorUserId: actor.id,
      action: "DOCUMENT_GET",
      entity: "Document",
      entityId: id,
      scopeType: actor.scope.type,
      countyId: actor.scope.countyId ?? null,
      organizationId: actor.scope.organizationId ?? null,
      meta: { scopeType: document.scopeType },
    });

    return document;
  }

  async create(actor: UserContext, dto: CreateDocumentDto) {
    await this.assertScopeInput(actor, dto.scopeType, dto.countyId, dto.organizationId);

    const created = await this.prisma.document.create({
      data: {
        title: dto.title,
        description: dto.description,
        category: dto.category,
        fileUrl: dto.fileUrl,
        mimeType: dto.mimeType,
        sizeBytes: dto.sizeBytes,
        scopeType: dto.scopeType,
        countyId: dto.countyId ?? null,
        organizationId: dto.organizationId ?? null,
        createdByUserId: actor.id,
      },
    });

    await this.audit.log({
      actorUserId: actor.id,
      action: "DOCUMENT_CREATE",
      entity: "Document",
      entityId: created.id,
      scopeType: actor.scope.type,
      countyId: actor.scope.countyId ?? null,
      organizationId: actor.scope.organizationId ?? null,
      meta: { scopeType: dto.scopeType, countyId: dto.countyId ?? null, organizationId: dto.organizationId ?? null },
    });

    return created;
  }

  async update(id: string, actor: UserContext, dto: UpdateDocumentDto) {
    const document = await this.prisma.document.findUnique({
      where: { id },
      include: { organization: { select: { countyId: true } } },
    });
    if (!document) throw new NotFoundException("Document not found");

    await this.assertCanManage(actor, document);

    const nextScopeType = dto.scopeType ?? document.scopeType;
    const nextCountyId = dto.countyId ?? document.countyId ?? undefined;
    const nextOrganizationId = dto.organizationId ?? document.organizationId ?? undefined;

    if (dto.scopeType || dto.countyId || dto.organizationId) {
      await this.assertScopeInput(actor, nextScopeType, nextCountyId, nextOrganizationId);
    }

    const updated = await this.prisma.document.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        category: dto.category,
        fileUrl: dto.fileUrl,
        mimeType: dto.mimeType,
        sizeBytes: dto.sizeBytes,
        scopeType: dto.scopeType,
        countyId: dto.countyId,
        organizationId: dto.organizationId,
      },
    });

    await this.audit.log({
      actorUserId: actor.id,
      action: "DOCUMENT_UPDATE",
      entity: "Document",
      entityId: id,
      scopeType: actor.scope.type,
      countyId: actor.scope.countyId ?? null,
      organizationId: actor.scope.organizationId ?? null,
      meta: { updates: Object.keys(dto) },
    });

    return updated;
  }

  async remove(id: string, actor: UserContext) {
    const document = await this.prisma.document.findUnique({
      where: { id },
      include: { organization: { select: { countyId: true } } },
    });
    if (!document) throw new NotFoundException("Document not found");

    await this.assertCanManage(actor, document);

    const deleted = await this.prisma.document.delete({ where: { id } });

    await this.audit.log({
      actorUserId: actor.id,
      action: "DOCUMENT_DELETE",
      entity: "Document",
      entityId: id,
      scopeType: actor.scope.type,
      countyId: actor.scope.countyId ?? null,
      organizationId: actor.scope.organizationId ?? null,
      meta: { scopeType: document.scopeType },
    });

    return deleted;
  }
}
