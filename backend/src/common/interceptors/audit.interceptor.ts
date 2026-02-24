import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { AuditService } from "../../modules/audit/audit.service";

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private audit: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;
    const path = req.originalUrl || req.url;

    const isMutation = ["POST", "PATCH", "PUT", "DELETE"].includes(method);

    return next.handle().pipe(
      tap(async (result) => {
        if (!isMutation) return;

        const actorUserId = req.user?.id ?? null;
        const scope = req.user?.scope ?? null;

        await this.audit.log({
          actorUserId,
          action: `${method} ${path}`,
          entity: "HTTP",
          entityId: null,
          scopeType: scope?.type ?? null,
          countyId: scope?.countyId ?? null,
          organizationId: scope?.organizationId ?? null,
          meta: {
            ip: req.ip,
            userAgent: req.headers["user-agent"],
          },
        });
      }),
    );
  }
}
