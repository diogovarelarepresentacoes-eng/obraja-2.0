import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentType, UserStatus } from '@obraja/types';

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

const MIME_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
};

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async uploadForPending(
    userId: string,
    docType: DocumentType,
    file: Express.Multer.File,
  ) {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      throw new BadRequestException(
        'Tipo de arquivo não permitido. Use PDF, JPG, PNG ou WEBP.',
      );
    }
    if (file.size > MAX_BYTES) {
      throw new BadRequestException('Arquivo muito grande. Máximo 10 MB.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { status: true },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    if (user.status !== UserStatus.PENDING_REVIEW) {
      throw new BadRequestException(
        'Upload disponível apenas para cadastros aguardando aprovação',
      );
    }

    const uploadsDir = join(process.cwd(), 'uploads');
    if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });

    const ext =
      extname(file.originalname).toLowerCase() ||
      MIME_EXT[file.mimetype] ||
      '.bin';
    const filename = `${randomUUID()}${ext}`;
    writeFileSync(join(uploadsDir, filename), file.buffer);

    const base = this.config.get<string>('API_BASE_URL', 'http://localhost:3001');
    const fileUrl = `${base}/uploads/${filename}`;

    // Upsert — one document record per type per user
    const existing = await this.prisma.document.findFirst({
      where: { userId, type: docType },
    });

    const payload = {
      fileUrl,
      fileSize: file.size,
      mimeType: file.mimetype,
      status: 'PENDING' as const,
    };

    if (existing) {
      return this.prisma.document.update({
        where: { id: existing.id },
        data: payload,
      });
    }

    return this.prisma.document.create({
      data: { userId, type: docType, ...payload },
    });
  }
}
