import { ExecutionContext } from "@nestjs/common";
import { of } from "rxjs";
import { AuditInterceptor } from "./audit.interceptor";

const mockAuditLog = jest.fn().mockResolvedValue(undefined);
const mockAudit = { log: mockAuditLog };

function makeContext(method: string, url: string, user?: unknown): ExecutionContext {
  const req = { method, url, originalUrl: url, headers: {}, ip: "127.0.0.1", user };
  return {
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
}

function makeHandler(value = {}) {
  return { handle: () => of(value) };
}

describe("AuditInterceptor", () => {
  let interceptor: AuditInterceptor;

  beforeEach(() => {
    interceptor = new AuditInterceptor(mockAudit as any);
    jest.clearAllMocks();
  });

  it("does NOT log for GET requests", (done) => {
    const ctx = makeContext("GET", "/api/v1/geo/counties");
    interceptor.intercept(ctx, makeHandler()).subscribe(() => {
      // Give the async tap a chance to run
      setImmediate(() => {
        expect(mockAuditLog).not.toHaveBeenCalled();
        done();
      });
    });
  });

  it("logs for POST mutations", (done) => {
    const ctx = makeContext("POST", "/api/v1/auth/register", { id: "u1", scope: { type: "SELF" } });
    interceptor.intercept(ctx, makeHandler()).subscribe(() => {
      setImmediate(() => {
        expect(mockAuditLog).toHaveBeenCalledWith(
          expect.objectContaining({
            actorUserId: "u1",
            action: "POST /api/v1/auth/register",
            entity: "HTTP",
            scopeType: "SELF",
          }),
        );
        done();
      });
    });
  });

  it("logs for DELETE mutations with null actorUserId when no user", (done) => {
    const ctx = makeContext("DELETE", "/api/v1/something/1");
    interceptor.intercept(ctx, makeHandler()).subscribe(() => {
      setImmediate(() => {
        expect(mockAuditLog).toHaveBeenCalledWith(
          expect.objectContaining({
            actorUserId: null,
            action: "DELETE /api/v1/something/1",
          }),
        );
        done();
      });
    });
  });
});
