import { INestApplication } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import { mkdtemp, rm, stat } from "fs/promises";
import { tmpdir } from "os";
import { basename, join } from "path";
import * as request from "supertest";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ScopeGuard } from "../../common/guards/scope.guard";
import { uploadsConfig } from "../../config/uploads.config";
import { DocumentsController } from "./documents.controller";
import { DocumentsService } from "./documents.service";
import { StorageService } from "./storage.service";

describe("DocumentsController upload", () => {
  let app: INestApplication;
  let uploadsDir: string;

  beforeAll(async () => {
    uploadsDir = await mkdtemp(join(tmpdir(), "arca-uploads-"));
    process.env.UPLOADS_DIR = uploadsDir;

    const documentsServiceMock = {
      create: jest.fn(),
      list: jest.fn(),
      get: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true, load: [uploadsConfig] })],
      controllers: [DocumentsController],
      providers: [
        StorageService,
        { provide: DocumentsService, useValue: documentsServiceMock },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(ScopeGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    await rm(uploadsDir, { recursive: true, force: true });
  });

  it("uploads a file and returns metadata", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/v1/documents/upload")
      .attach("file", Buffer.from("hello"), {
        filename: "sample.pdf",
        contentType: "application/pdf",
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(
      expect.objectContaining({
        mimeType: "application/pdf",
        sizeBytes: 5,
      }),
    );
    expect(response.body.fileUrl).toMatch(/^\/uploads\//);

    const storedPath = join(uploadsDir, basename(response.body.fileUrl));
    await expect(stat(storedPath)).resolves.toBeDefined();
  });
});
