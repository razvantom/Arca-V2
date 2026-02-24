import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";

/**
 * Enforces scope restrictions based on req.user.scope.
 *
 * GLOBAL  → full access, no further checks needed.
 * COUNTY  → request must not target a different county than the user's assigned countyId.
 * ORG     → request must not target a different organization than the user's assigned organizationId.
 * SELF    → request must only target the authenticated user's own resources (userId param must match).
 *
 * Services are still responsible for filtering query results by scope. This guard
 * blocks obviously out-of-scope requests early and rejects missing scope contexts.
 */
@Injectable()
export class ScopeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const scope = req.user?.scope;
    if (!scope) throw new ForbiddenException("Missing scope context");

    const { type, countyId, organizationId } = scope;
    const params = req.params ?? {};
    const body = req.body ?? {};

    if (type === "GLOBAL") return true;

    if (type === "COUNTY") {
      const requested = this.extractParam(params, body, "countyId");
      if (requested != null && countyId != null && requested !== countyId) {
        throw new ForbiddenException("Access denied: county scope mismatch");
      }
      return true;
    }

    if (type === "ORG") {
      const requested =
        this.extractParam(params, body, "organizationId") ??
        this.extractParam(params, body, "orgId");
      if (requested != null && organizationId != null && requested !== organizationId) {
        throw new ForbiddenException("Access denied: organization scope mismatch");
      }
      return true;
    }

    if (type === "SELF") {
      const requestedUserId = params["userId"] ?? body["userId"] ?? null;
      if (requestedUserId != null && requestedUserId !== req.user?.id) {
        throw new ForbiddenException("Access denied: self scope — can only access own data");
      }
      return true;
    }

    throw new ForbiddenException("Unknown scope type");
  }

  private extractParam(
    params: Record<string, string>,
    body: Record<string, unknown>,
    key: string,
  ): number | null {
    if (params[key] != null) return Number(params[key]);
    if (body[key] != null) return Number(body[key]);
    return null;
  }
}
