import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { ScopeGuard } from "./scope.guard";

function makeContext(user: unknown, params: Record<string, string> = {}, body: Record<string, unknown> = {}): ExecutionContext {
  const req = { user, params, body };
  return {
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
}

describe("ScopeGuard", () => {
  const guard = new ScopeGuard();

  it("throws ForbiddenException when scope is missing", () => {
    const ctx = makeContext({ id: "u1", roles: [], scope: undefined });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it("allows GLOBAL scope unconditionally", () => {
    const ctx = makeContext({ id: "u1", roles: [], scope: { type: "GLOBAL" } });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it("allows COUNTY scope when countyId param matches", () => {
    const ctx = makeContext(
      { id: "u1", roles: [], scope: { type: "COUNTY", countyId: 5 } },
      { countyId: "5" },
    );
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it("throws ForbiddenException for COUNTY scope when countyId param mismatches", () => {
    const ctx = makeContext(
      { id: "u1", roles: [], scope: { type: "COUNTY", countyId: 5 } },
      { countyId: "9" },
    );
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it("allows ORG scope when organizationId param matches", () => {
    const ctx = makeContext(
      { id: "u1", roles: [], scope: { type: "ORG", organizationId: 10 } },
      { organizationId: "10" },
    );
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it("throws ForbiddenException for ORG scope when organizationId param mismatches", () => {
    const ctx = makeContext(
      { id: "u1", roles: [], scope: { type: "ORG", organizationId: 10 } },
      { organizationId: "99" },
    );
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it("allows SELF scope when userId param matches own id", () => {
    const ctx = makeContext(
      { id: "user-abc", roles: [], scope: { type: "SELF" } },
      { userId: "user-abc" },
    );
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it("throws ForbiddenException for SELF scope when userId param differs", () => {
    const ctx = makeContext(
      { id: "user-abc", roles: [], scope: { type: "SELF" } },
      { userId: "user-xyz" },
    );
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
