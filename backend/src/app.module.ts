import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { GeoModule } from "./modules/geo/geo.module";
import { AuthModule } from "./modules/auth/auth.module";
import { HealthController } from "./health.controller";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    GeoModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
