import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { DocumentsService, UserContext } from "./documents.service";
import { CreateDocumentDto } from "./dto/create-document.dto";
import { UpdateDocumentDto } from "./dto/update-document.dto";
import { ListDocumentsDto } from "./dto/list-documents.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ScopeGuard } from "../../common/guards/scope.guard";

@UseGuards(JwtAuthGuard, ScopeGuard)
@Controller("/api/v1/documents")
export class DocumentsController {
  constructor(private documents: DocumentsService) {}

  @Post()
  create(@Req() req: Request, @Body() dto: CreateDocumentDto) {
    return this.documents.create((req as any).user as UserContext, dto);
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
