import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { GeoModule } from "./modules/geo/geo.module";
import { AuthModule } from "./modules/auth/auth.module";
import { MembershipsModule } from "./modules/memberships/memberships.module";
import { JwtMiddleware } from "./common/middleware/jwt.middleware";
import { HealthController } from "./health.controller";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    GeoModule,
    MembershipsModule,
  ],
  controllers: [HealthController],
  providers: [JwtMiddleware],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtMiddleware).forRoutes("*");
  }
}
