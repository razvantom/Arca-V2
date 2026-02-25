import { ForbiddenException } from "@nestjs/common";
import { DocumentsService, UserContext } from "./documents.service";
import { AuditService } from "../audit/audit.service";
import { CreateDocumentDto, DocumentScopeType } from "./dto/create-document.dto";

function makePrisma(overrides: Record<string, any> = {}) {
  return {
    document: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    organization: {
      findUnique: jest.fn(),
    },
    ...overrides,
  };
}

function makeAudit() {
  return { log: jest.fn().mockResolvedValue(undefined) } as unknown as AuditService;
}

function makeActor(overrides: Partial<UserContext> = {}): UserContext {
  return {
    id: "actor-1",
    roles: [],
    scope: { type: "GLOBAL" },
    ...overrides,
  };
}

function makeDocument(overrides: Record<string, any> = {}) {
  return {
    id: "doc-1",
    title: "Policy",
    description: null,
    category: "General",
    fileUrl: "https://example.com/doc.pdf",
    mimeType: "application/pdf",
    sizeBytes: 1200,
    scopeType: "ORG",
    countyId: null,
    organizationId: 10,
    createdByUserId: "user-1",
    organization: { countyId: 5 },
    ...overrides,
  };
}

describe("DocumentsService.list", () => {
  it("GLOBAL actor gets all documents", async () => {
    const prisma = makePrisma();
    prisma.document.findMany.mockResolvedValue([]);
    const service = new DocumentsService(prisma as any, makeAudit());

    await service.list(makeActor({ scope: { type: "GLOBAL" } }), {});

    expect(prisma.document.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    );
  });

  it("COUNTY actor sees county, org-in-county, and global documents", async () => {
    const prisma = makePrisma();
    prisma.document.findMany.mockResolvedValue([]);
    const service = new DocumentsService(prisma as any, makeAudit());

    await service.list(makeActor({ scope: { type: "COUNTY", countyId: 5 } }), {});

    const where = prisma.document.findMany.mock.calls[0][0].where;
    expect(where.OR).toEqual(
      expect.arrayContaining([
        { scopeType: "GLOBAL" },
        { scopeType: "COUNTY", countyId: 5 },
        { scopeType: "ORG", organization: { countyId: 5 } },
      ]),
    );
  });

  it("ORG actor sees org, county, and global documents", async () => {
    const prisma = makePrisma();
    prisma.document.findMany.mockResolvedValue([]);
    prisma.organization.findUnique.mockResolvedValue({ countyId: 7 });
    const service = new DocumentsService(prisma as any, makeAudit());

    await service.list(makeActor({ scope: { type: "ORG", organizationId: 42 } }), {});

    expect(prisma.organization.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 42 } }),
    );
    const where = prisma.document.findMany.mock.calls[0][0].where;
    expect(where.OR).toEqual(
      expect.arrayContaining([
        { scopeType: "GLOBAL" },
        { scopeType: "ORG", organizationId: 42 },
        { scopeType: "COUNTY", countyId: 7 },
      ]),
    );
  });

  it("SELF actor sees global and owned documents", async () => {
    const prisma = makePrisma();
    prisma.document.findMany.mockResolvedValue([]);
    const service = new DocumentsService(prisma as any, makeAudit());

    await service.list(makeActor({ id: "self-1", scope: { type: "SELF" } }), {});

    const where = prisma.document.findMany.mock.calls[0][0].where;
    expect(where.OR).toEqual(
      expect.arrayContaining([{ scopeType: "GLOBAL" }, { createdByUserId: "self-1" }]),
    );
  });

  it("throws ForbiddenException when COUNTY actor has no countyId", async () => {
    const prisma = makePrisma();
    const service = new DocumentsService(prisma as any, makeAudit());

    await expect(service.list(makeActor({ scope: { type: "COUNTY" } }), {})).rejects.toThrow(
      ForbiddenException,
    );
  });
});

describe("DocumentsService.get", () => {
  it("ORG actor cannot access documents from another organization", async () => {
    const prisma = makePrisma();
    prisma.document.findUnique.mockResolvedValue(
      makeDocument({ organizationId: 99, scopeType: "ORG", createdByUserId: "user-2" }),
    );
    const service = new DocumentsService(prisma as any, makeAudit());

    await expect(
      service.get("doc-1", makeActor({ scope: { type: "ORG", organizationId: 42 } })),
    ).rejects.toThrow(ForbiddenException);
  });
});

describe("DocumentsService.create", () => {
  it("SELF scope cannot create documents", async () => {
    const prisma = makePrisma();
    const service = new DocumentsService(prisma as any, makeAudit());
    const dto: CreateDocumentDto = {
      title: "Handbook",
      category: "Policy",
      fileUrl: "https://example.com/handbook.pdf",
      mimeType: "application/pdf",
      sizeBytes: 500,
      scopeType: DocumentScopeType.ORG,
      organizationId: 9,
    };

    await expect(
      service.create(makeActor({ scope: { type: "SELF" } }), dto),
    ).rejects.toThrow(ForbiddenException);
  });
});

describe("DocumentsService.update", () => {
  it("allows the owner to update even with SELF scope", async () => {
    const prisma = makePrisma();
    prisma.document.findUnique.mockResolvedValue(
      makeDocument({ createdByUserId: "owner-1", scopeType: "ORG" }),
    );
    prisma.document.update.mockResolvedValue(makeDocument({ title: "Updated", createdByUserId: "owner-1" }));
    const service = new DocumentsService(prisma as any, makeAudit());

    await service.update("doc-1", makeActor({ id: "owner-1", scope: { type: "SELF" } }), {
      title: "Updated",
    });

    expect(prisma.document.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ title: "Updated" }) }),
    );
  });
});
