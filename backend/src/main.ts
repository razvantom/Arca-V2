import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import { DEFAULT_UPLOADS_DIR } from "./config/uploads.config";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);
  const uploadsDir = config.get<string>("uploads.dir") || DEFAULT_UPLOADS_DIR;

  app.useStaticAssets(uploadsDir, { prefix: "/uploads" });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: true,
    credentials: true,
  });

  await app.listen(process.env.PORT || 3001);
}
bootstrap();
