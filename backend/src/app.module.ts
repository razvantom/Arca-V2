import { Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { uploadsConfig } from "./config/uploads.config";
import { PrismaModule } from "./prisma/prisma.module";
import { GeoModule } from "./modules/geo/geo.module";
import { AuthModule } from "./modules/auth/auth.module";
import { AuditModule } from "./modules/audit/audit.module";
import { MembershipsModule } from "./modules/memberships/memberships.module";
import { DocumentsModule } from "./modules/documents/documents.module";
import { AuditInterceptor } from "./common/interceptors/audit.interceptor";
import { HealthController } from "./health.controller";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [uploadsConfig] }),
    PrismaModule,
    AuthModule,
    GeoModule,
    AuditModule,
    MembershipsModule,
    DocumentsModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
