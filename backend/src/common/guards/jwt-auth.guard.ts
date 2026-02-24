import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../prisma/prisma.service";

const SCOPE_PRIORITY: Record<string, number> = {
  GLOBAL: 4,
  COUNTY: 3,
  ORG: 2,
  SELF: 1,
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwt: JwtService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const token = this.extractToken(req);
    if (!token) throw new UnauthorizedException("Missing access token");

    let payload: { sub: string };
    try {
      payload = await this.jwt.verifyAsync<{ sub: string }>(token);
    } catch {
      throw new UnauthorizedException("Invalid or expired access token");
    }

    const now = new Date();
    const assignments = await this.prisma.accessAssignment.findMany({
      where: {
        userId: payload.sub,
        AND: [
          { startAt: { lte: now } },
          { OR: [{ endAt: null }, { endAt: { gte: now } }] },
        ],
      },
      include: { role: true },
    });

    const roles = assignments.map((a) => a.role.key);

    // Pick the highest-priority scope assignment
    let best = assignments[0] ?? null;
    for (const a of assignments) {
      const p = SCOPE_PRIORITY[a.role.scopeType] ?? 0;
      const bp = SCOPE_PRIORITY[best?.role?.scopeType ?? ""] ?? 0;
      if (p > bp) best = a;
    }

    const scope = best
      ? {
          type: best.role.scopeType as "GLOBAL" | "COUNTY" | "ORG" | "SELF",
          countyId: best.countyId ?? undefined,
          organizationId: best.organizationId ?? undefined,
        }
      : { type: "SELF" as const };

    req.user = { id: payload.sub, roles, scope };
    return true;
  }

  private extractToken(req: { headers: Record<string, string | undefined> }): string | null {
    const auth = req.headers["authorization"];
    if (!auth || !auth.startsWith("Bearer ")) return null;
    return auth.slice(7);
  }
}
