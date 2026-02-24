import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { JwtAuthGuard } from "./jwt-auth.guard";

const mockAssignments = [
  {
    role: { key: "SUPPORTER", scopeType: "SELF" },
    countyId: null,
    organizationId: null,
  },
];

const mockPrisma = {
  accessAssignment: {
    findMany: jest.fn().mockResolvedValue(mockAssignments),
  },
};

const mockJwt = {
  verifyAsync: jest.fn(),
};

function makeContext(headers: Record<string, string>): ExecutionContext {
  const req = { headers, params: {}, body: {}, user: undefined as unknown };
  return {
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
}

describe("JwtAuthGuard", () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    guard = new JwtAuthGuard(mockJwt as unknown as JwtService, mockPrisma as any);
    jest.clearAllMocks();
    mockPrisma.accessAssignment.findMany.mockResolvedValue(mockAssignments);
  });

  it("throws UnauthorizedException when Authorization header is missing", async () => {
    const ctx = makeContext({});
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("throws UnauthorizedException when token is invalid", async () => {
    mockJwt.verifyAsync.mockRejectedValue(new Error("invalid"));
    const ctx = makeContext({ authorization: "Bearer bad.token" });
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("sets req.user with id, roles, and scope on valid token", async () => {
    mockJwt.verifyAsync.mockResolvedValue({ sub: "user-1" });
    const ctx = makeContext({ authorization: "Bearer valid.token" });
    const req = ctx.switchToHttp().getRequest() as any;

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(req.user.id).toBe("user-1");
    expect(req.user.roles).toEqual(["SUPPORTER"]);
    expect(req.user.scope.type).toBe("SELF");
  });

  it("picks GLOBAL scope over SELF when user has both", async () => {
    mockJwt.verifyAsync.mockResolvedValue({ sub: "user-2" });
    mockPrisma.accessAssignment.findMany.mockResolvedValue([
      { role: { key: "SUPPORTER", scopeType: "SELF" }, countyId: null, organizationId: null },
      { role: { key: "ADMIN_ARCA", scopeType: "GLOBAL" }, countyId: null, organizationId: null },
    ]);
    const ctx = makeContext({ authorization: "Bearer valid.token" });
    const req = ctx.switchToHttp().getRequest() as any;

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(req.user.scope.type).toBe("GLOBAL");
  });
});
