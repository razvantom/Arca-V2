import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";

/**
 * Scope enforcement MUST be implemented properly in services/queries.
 * This guard is a placeholder that checks user has a scope context.
 */
@Injectable()
export class ScopeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();

    // Expected:
    // req.user.scope = { type: 'GLOBAL'|'COUNTY'|'ORG'|'SELF', countyId?: number, organizationId?: number }
    const scope = req.user?.scope;
    if (!scope) throw new ForbiddenException("Missing scope context");
    return true;
  }
}
