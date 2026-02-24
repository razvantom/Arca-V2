import { Injectable, NestMiddleware } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request, Response, NextFunction } from "express";
import { PrismaService } from "../../prisma/prisma.service";

interface AccessWithRole {
  role: { key: string; scopeType: string };
  countyId: number | null;
  organizationId: number | null;
}

@Injectable()
export class JwtMiddleware implements NestMiddleware {
  constructor(private jwt: JwtService, private prisma: PrismaService) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      try {
        const payload = this.jwt.verify<{ sub: string }>(token);
        const userId = payload.sub;

        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          include: {
            access: {
              include: { role: true },
              where: {
                OR: [{ endAt: null }, { endAt: { gt: new Date() } }],
              },
            },
          },
        });

        if (user) {
          const access: AccessWithRole[] = (user as any).access ?? [];
          const roles = access.map((a) => a.role.key);

          // Determine effective scope in priority order: GLOBAL > COUNTY > ORG > SELF
          let scope: { type: string; countyId?: number; organizationId?: number };
          const globalAssignment = access.find((a) => a.role.scopeType === "GLOBAL");
          if (globalAssignment) {
            scope = { type: "GLOBAL" };
          } else {
            const countyAssignment = access.find((a) => a.role.scopeType === "COUNTY");
            if (countyAssignment) {
              scope = { type: "COUNTY", countyId: countyAssignment.countyId ?? undefined };
            } else {
              const orgAssignment = access.find((a) => a.role.scopeType === "ORG");
              if (orgAssignment) {
                scope = { type: "ORG", organizationId: orgAssignment.organizationId ?? undefined };
              } else {
                scope = { type: "SELF" };
              }
            }
          }

          (req as any).user = { id: userId, roles, scope };
        }
      } catch {
        // Invalid or expired token — leave req.user unset
      }
    }
    next();
  }
}
