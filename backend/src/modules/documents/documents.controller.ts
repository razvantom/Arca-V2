import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Request } from "express";
import { DocumentsService, UserContext } from "./documents.service";
import { ALLOWED_DOCUMENT_MIME_TYPES, CreateDocumentDto } from "./dto/create-document.dto";
import { UpdateDocumentDto } from "./dto/update-document.dto";
import { ListDocumentsDto } from "./dto/list-documents.dto";
import { StorageService, UploadFile } from "./storage.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ScopeGuard } from "../../common/guards/scope.guard";

@UseGuards(JwtAuthGuard, ScopeGuard)
@Controller("/api/v1/documents")
export class DocumentsController {
  constructor(
    private documents: DocumentsService,
    private storage: StorageService,
  ) {}

  @Post()
  create(@Req() req: Request, @Body() dto: CreateDocumentDto) {
    return this.documents.create((req as any).user as UserContext, dto);
  }

  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  async upload(@UploadedFile() file: UploadFile) {
    if (!file) throw new BadRequestException("File is required");
    if (!ALLOWED_DOCUMENT_MIME_TYPES.includes(file.mimetype as (typeof ALLOWED_DOCUMENT_MIME_TYPES)[number])) {
      throw new BadRequestException("Unsupported file type");
    }
    return this.storage.saveFile(file);
  }

  @Get()
  list(@Req() req: Request, @Query() filters: ListDocumentsDto) {
    return this.documents.list((req as any).user as UserContext, filters);
  }

  @Get(":id")
  get(@Param("id") id: string, @Req() req: Request) {
    return this.documents.get(id, (req as any).user as UserContext);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Req() req: Request, @Body() dto: UpdateDocumentDto) {
    return this.documents.update(id, (req as any).user as UserContext, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @Req() req: Request) {
    return this.documents.remove(id, (req as any).user as UserContext);
  }
}
