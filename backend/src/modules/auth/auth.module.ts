import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.get<string>("JWT_SECRET") || "change_me",
        signOptions: { expiresIn: cfg.get<string>("JWT_EXPIRES_IN") || "15m" },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
