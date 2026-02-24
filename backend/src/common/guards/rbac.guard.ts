import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";

@Injectable()
export class RbacGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();

    // Expected shape:
    // req.user = { id: string, roles: string[] }
    const roles: string[] = req.user?.roles ?? [];
    if (roles.length === 0) throw new ForbiddenException("No roles assigned");
    return true;
  }
}
