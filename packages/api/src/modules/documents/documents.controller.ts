import {
  Controller,
  Post,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { Public } from '../../common/decorators/public.decorator';
import { DocumentType } from '@obraja/types';

const VALID_DOC_TYPES = new Set(Object.values(DocumentType));

@ApiTags('Documents')
@Controller('documents')
export class DocumentsController {
  constructor(private documentsService: DocumentsService) {}

  @Public()
  @Post('pending/:userId')
  @ApiOperation({ summary: 'Upload de documento para cadastro pendente de aprovação' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  upload(
    @Param('userId') userId: string,
    @Query('type') type: string,
    @UploadedFile() file: { buffer: Buffer; mimetype: string; size: number; originalname: string },
  ) {
    if (!file) throw new BadRequestException('Arquivo obrigatório');
    if (!type || !VALID_DOC_TYPES.has(type as DocumentType)) {
      throw new BadRequestException(`Tipo de documento inválido: "${type}"`);
    }
    return this.documentsService.uploadForPending(
      userId,
      type as DocumentType,
      file,
    );
  }
}
