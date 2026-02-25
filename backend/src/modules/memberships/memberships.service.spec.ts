import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { MembershipsService, UserContext } from "./memberships.service";
import { AuditService } from "../audit/audit.service";

// ---- helpers ----

function makePrisma(overrides: Record<string, any> = {}) {
  return {
    membership: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    role: {
      findUnique: jest.fn(),
    },
    accessAssignment: {
      findFirst: jest.fn(),
      create: jest.fn(),
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

function makeMembership(overrides: Record<string, any> = {}) {
  return {
    id: "mem-1",
    userId: "user-1",
    organizationId: 10,
    status: "PENDING",
    organization: { countyId: 1 },
    ...overrides,
  };
}

// ---- tests ----

describe("MembershipsService.list", () => {
  it("GLOBAL actor gets all memberships without county/org filter", async () => {
    const prisma = makePrisma();
    prisma.membership.findMany.mockResolvedValue([]);
    const service = new MembershipsService(prisma as any, makeAudit());

    await service.list(makeActor({ scope: { type: "GLOBAL" } }), {});

    expect(prisma.membership.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    );
  });

  it("COUNTY actor only sees memberships in their county", async () => {
    const prisma = makePrisma();
    prisma.membership.findMany.mockResolvedValue([]);
    const service = new MembershipsService(prisma as any, makeAudit());

    await service.list(makeActor({ scope: { type: "COUNTY", countyId: 5 } }), {});

    expect(prisma.membership.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organization: { countyId: 5 } } }),
    );
  });

  it("COUNTY actor in county-A cannot see memberships in county-B (scope filter enforced)", async () => {
    const prisma = makePrisma();
    prisma.membership.findMany.mockResolvedValue([]);
    const service = new MembershipsService(prisma as any, makeAudit());

    await service.list(makeActor({ scope: { type: "COUNTY", countyId: 99 } }), {});

    const callArgs = prisma.membership.findMany.mock.calls[0][0];
    // The where clause MUST contain organization.countyId = 99
    // so county-B (countyId != 99) memberships cannot appear.
    expect(callArgs.where).toMatchObject({ organization: { countyId: 99 } });
    // There must NOT be a broader scope (no missing countyId constraint)
    expect(callArgs.where).not.toHaveProperty("userId");
  });

  it("ORG actor only sees memberships in their organization", async () => {
    const prisma = makePrisma();
    prisma.membership.findMany.mockResolvedValue([]);
    const service = new MembershipsService(prisma as any, makeAudit());

    await service.list(makeActor({ scope: { type: "ORG", organizationId: 42 } }), {});

    expect(prisma.membership.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organizationId: 42 } }),
    );
  });

  it("SELF actor only sees their own membership", async () => {
    const prisma = makePrisma();
    prisma.membership.findMany.mockResolvedValue([]);
    const service = new MembershipsService(prisma as any, makeAudit());

    await service.list(makeActor({ id: "self-123", scope: { type: "SELF" } }), {});

    expect(prisma.membership.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "self-123" } }),
    );
  });

  it("throws ForbiddenException when COUNTY actor has no countyId", async () => {
    const prisma = makePrisma();
    const service = new MembershipsService(prisma as any, makeAudit());

    await expect(
      service.list(makeActor({ scope: { type: "COUNTY" } }), {}),
    ).rejects.toThrow(ForbiddenException);
  });

  it("audits the list action", async () => {
    const prisma = makePrisma();
    prisma.membership.findMany.mockResolvedValue([]);
    const audit = makeAudit();
    const service = new MembershipsService(prisma as any, audit);

    await service.list(makeActor(), {});

    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: "MEMBERSHIP_LIST" }));
  });
});

describe("MembershipsService.approve", () => {
  it("SELF scope cannot approve", async () => {
    const service = new MembershipsService(makePrisma() as any, makeAudit());

    await expect(
      service.approve("mem-1", makeActor({ scope: { type: "SELF" } })),
    ).rejects.toThrow(ForbiddenException);
  });

  it("actor cannot approve their own membership", async () => {
    const prisma = makePrisma();
    prisma.membership.findUnique.mockResolvedValue(
      makeMembership({ userId: "actor-1" }),
    );
    const service = new MembershipsService(prisma as any, makeAudit());

    await expect(
      service.approve("mem-1", makeActor({ id: "actor-1" })),
    ).rejects.toThrow(ForbiddenException);
  });

  it("COUNTY actor in county-A cannot approve membership in county-B", async () => {
    const prisma = makePrisma();
    // Membership is in county 2, actor is county 1
    prisma.membership.findUnique.mockResolvedValue(
      makeMembership({ organization: { countyId: 2 } }),
    );
    const service = new MembershipsService(prisma as any, makeAudit());

    await expect(
      service.approve("mem-1", makeActor({ id: "actor-1", scope: { type: "COUNTY", countyId: 1 } })),
    ).rejects.toThrow(ForbiddenException);
  });

  it("ORG actor cannot approve membership in a different organization", async () => {
    const prisma = makePrisma();
    prisma.membership.findUnique.mockResolvedValue(
      makeMembership({ organizationId: 99 }),
    );
    const service = new MembershipsService(prisma as any, makeAudit());

    await expect(
      service.approve("mem-1", makeActor({ id: "actor-1", scope: { type: "ORG", organizationId: 42 } })),
    ).rejects.toThrow(ForbiddenException);
  });

  it("GLOBAL actor can approve any membership and sets ACTIVE + MEMBER role", async () => {
    const prisma = makePrisma();
    const mem = makeMembership({ userId: "user-1" });
    prisma.membership.findUnique.mockResolvedValue(mem);
    prisma.role.findUnique.mockResolvedValue({ id: 5, key: "MEMBER" });
    prisma.accessAssignment.findFirst.mockResolvedValue(null);
    prisma.accessAssignment.create.mockResolvedValue({});
    prisma.membership.update.mockResolvedValue({ ...mem, status: "ACTIVE" });

    const service = new MembershipsService(prisma as any, makeAudit());
    const result = await service.approve("mem-1", makeActor({ id: "actor-1" }));

    expect(prisma.membership.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "ACTIVE", approvedById: "actor-1" }),
      }),
    );
    expect(prisma.accessAssignment.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: { userId: "user-1", roleId: 5 } }),
    );
    expect(result.status).toBe("ACTIVE");
  });

  it("does not duplicate MEMBER role if already assigned", async () => {
    const prisma = makePrisma();
    const mem = makeMembership({ userId: "user-1" });
    prisma.membership.findUnique.mockResolvedValue(mem);
    prisma.role.findUnique.mockResolvedValue({ id: 5, key: "MEMBER" });
    prisma.membership.update.mockResolvedValue({ ...mem, status: "ACTIVE" });
    // MEMBER role already present
    prisma.accessAssignment.findFirst.mockResolvedValue({ id: "existing" });

    const service = new MembershipsService(prisma as any, makeAudit());
    await service.approve("mem-1", makeActor({ id: "actor-1" }));

    expect(prisma.accessAssignment.create).not.toHaveBeenCalled();
  });

  it("throws NotFoundException when membership does not exist", async () => {
    const prisma = makePrisma();
    prisma.membership.findUnique.mockResolvedValue(null);
    const service = new MembershipsService(prisma as any, makeAudit());

    await expect(service.approve("nonexistent", makeActor())).rejects.toThrow(NotFoundException);
  });

  it("audits the approve action", async () => {
    const prisma = makePrisma();
    const mem = makeMembership();
    prisma.membership.findUnique.mockResolvedValue(mem);
    prisma.role.findUnique.mockResolvedValue({ id: 5, key: "MEMBER" });
    prisma.accessAssignment.findFirst.mockResolvedValue(null);
    prisma.accessAssignment.create.mockResolvedValue({});
    prisma.membership.update.mockResolvedValue({ ...mem, status: "ACTIVE" });
    const audit = makeAudit();

    const service = new MembershipsService(prisma as any, audit);
    await service.approve("mem-1", makeActor({ id: "actor-1" }));

    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: "MEMBERSHIP_APPROVE", entityId: "mem-1" }),
    );
  });
});

describe("MembershipsService.reject", () => {
  it("SELF scope cannot reject", async () => {
    const service = new MembershipsService(makePrisma() as any, makeAudit());

    await expect(
      service.reject("mem-1", makeActor({ scope: { type: "SELF" } })),
    ).rejects.toThrow(ForbiddenException);
  });

  it("COUNTY actor in county-A cannot reject membership in county-B", async () => {
    const prisma = makePrisma();
    prisma.membership.findUnique.mockResolvedValue(
      makeMembership({ organization: { countyId: 2 } }),
    );
    const service = new MembershipsService(prisma as any, makeAudit());

    await expect(
      service.reject("mem-1", makeActor({ id: "actor-1", scope: { type: "COUNTY", countyId: 1 } })),
    ).rejects.toThrow(ForbiddenException);
  });

  it("ORG actor cannot reject membership in a different organization", async () => {
    const prisma = makePrisma();
    prisma.membership.findUnique.mockResolvedValue(
      makeMembership({ organizationId: 99 }),
    );
    const service = new MembershipsService(prisma as any, makeAudit());

    await expect(
      service.reject("mem-1", makeActor({ id: "actor-1", scope: { type: "ORG", organizationId: 42 } })),
    ).rejects.toThrow(ForbiddenException);
  });

  it("GLOBAL actor can reject and sets REJECTED status", async () => {
    const prisma = makePrisma();
    const mem = makeMembership();
    prisma.membership.findUnique.mockResolvedValue(mem);
    prisma.membership.update.mockResolvedValue({ ...mem, status: "REJECTED" });

    const service = new MembershipsService(prisma as any, makeAudit());
    const result = await service.reject("mem-1", makeActor());

    expect(prisma.membership.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "REJECTED" } }),
    );
    expect(result.status).toBe("REJECTED");
  });

  it("audits the reject action", async () => {
    const prisma = makePrisma();
    const mem = makeMembership();
    prisma.membership.findUnique.mockResolvedValue(mem);
    prisma.membership.update.mockResolvedValue({ ...mem, status: "REJECTED" });
    const audit = makeAudit();

    const service = new MembershipsService(prisma as any, audit);
    await service.reject("mem-1", makeActor());

    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: "MEMBERSHIP_REJECT", entityId: "mem-1" }),
    );
  });
});

describe("MembershipsService.suspend", () => {
  it("SELF scope cannot suspend", async () => {
    const service = new MembershipsService(makePrisma() as any, makeAudit());

    await expect(
      service.suspend("mem-1", makeActor({ scope: { type: "SELF" } })),
    ).rejects.toThrow(ForbiddenException);
  });

  it("COUNTY actor in county-A cannot suspend membership in county-B", async () => {
    const prisma = makePrisma();
    prisma.membership.findUnique.mockResolvedValue(
      makeMembership({ organization: { countyId: 2 } }),
    );
    const service = new MembershipsService(prisma as any, makeAudit());

    await expect(
      service.suspend("mem-1", makeActor({ id: "actor-1", scope: { type: "COUNTY", countyId: 1 } })),
    ).rejects.toThrow(ForbiddenException);
  });

  it("ORG actor cannot suspend membership in a different organization", async () => {
    const prisma = makePrisma();
    prisma.membership.findUnique.mockResolvedValue(
      makeMembership({ organizationId: 99 }),
    );
    const service = new MembershipsService(prisma as any, makeAudit());

    await expect(
      service.suspend("mem-1", makeActor({ id: "actor-1", scope: { type: "ORG", organizationId: 42 } })),
    ).rejects.toThrow(ForbiddenException);
  });

  it("GLOBAL actor can suspend and sets SUSPENDED status", async () => {
    const prisma = makePrisma();
    const mem = makeMembership();
    prisma.membership.findUnique.mockResolvedValue(mem);
    prisma.membership.update.mockResolvedValue({ ...mem, status: "SUSPENDED" });

    const service = new MembershipsService(prisma as any, makeAudit());
    const result = await service.suspend("mem-1", makeActor());

    expect(prisma.membership.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "SUSPENDED" } }),
    );
    expect(result.status).toBe("SUSPENDED");
  });

  it("audits the suspend action", async () => {
    const prisma = makePrisma();
    const mem = makeMembership();
    prisma.membership.findUnique.mockResolvedValue(mem);
    prisma.membership.update.mockResolvedValue({ ...mem, status: "SUSPENDED" });
    const audit = makeAudit();

    const service = new MembershipsService(prisma as any, audit);
    await service.suspend("mem-1", makeActor());

    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: "MEMBERSHIP_SUSPEND", entityId: "mem-1" }),
    );
  });
});
