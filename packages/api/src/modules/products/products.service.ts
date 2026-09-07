import {
  Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException,
} from '@nestjs/common';
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from 'fs';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto, UpdateStockDto } from './dto/update-product.dto';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .concat('-', Date.now().toString(36));
}

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateProductDto) {
    const supplier = await this.prisma.supplierProfile.findUnique({ where: { userId } });
    if (!supplier) throw new ForbiddenException('Perfil de fornecedor não encontrado');

    const slug = slugify(dto.name);

    return this.prisma.product.create({
      data: {
        ...dto,
        slug,
        supplierId: supplier.id,
        unit: dto.unit ?? 'un',
        moq: dto.moq ?? 1,
      },
      include: { category: { select: { id: true, name: true } }, images: true },
    });
  }

  async findPublic(filters: {
    search?: string;
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    supplierId?: string;
    page?: number;
    limit?: number;
  }) {
    const { search, categoryId, minPrice, maxPrice, supplierId, page = 1, limit = 24 } = filters;
    const skip = (page - 1) * limit;

    const where = {
      status: 'ACTIVE' as const,
      deletedAt: null,
      supplier: { user: { status: 'APPROVED' as const } },
      ...(search && { name: { contains: search, mode: 'insensitive' as const } }),
      ...(categoryId && { categoryId }),
      ...(supplierId && { supplierId }),
      ...(minPrice !== undefined || maxPrice !== undefined
        ? { price: { gte: minPrice, lte: maxPrice } }
        : {}),
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isHighlighted: 'desc' }, { createdAt: 'desc' }],
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          category: { select: { id: true, name: true, slug: true } },
          supplier: { select: { companyName: true, tradeName: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { data: products, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug, status: 'ACTIVE', deletedAt: null },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        category: { include: { parent: true } },
        supplier: {
          select: { companyName: true, tradeName: true, logoUrl: true, address: true, isVerified: true },
        },
      },
    });

    if (!product) throw new NotFoundException('Produto não encontrado');
    return product;
  }

  async findMine(userId: string, page: number, limit: number) {
    const supplier = await this.prisma.supplierProfile.findUnique({ where: { userId } });
    if (!supplier) throw new ForbiddenException('Perfil de fornecedor não encontrado');

    const skip = (page - 1) * limit;
    const where = { supplierId: supplier.id, deletedAt: null };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          category: { select: { id: true, name: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { data: products, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, userId?: string) {
    const product = await this.prisma.product.findUnique({
      where: { id, deletedAt: null },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        category: true,
        supplier: { select: { userId: true, companyName: true } },
      },
    });

    if (!product) throw new NotFoundException('Produto não encontrado');
    if (userId && product.supplier.userId !== userId) throw new ForbiddenException();

    return product;
  }

  async update(id: string, userId: string, dto: UpdateProductDto) {
    await this.findOne(id, userId);
    return this.prisma.product.update({
      where: { id },
      data: dto,
      include: { category: { select: { id: true, name: true } }, images: true },
    });
  }

  async updateStock(id: string, userId: string, dto: UpdateStockDto) {
    const product = await this.findOne(id, userId);

    const newStock =
      dto.stock !== undefined
        ? dto.stock
        : product.stock + (dto.delta ?? 0);

    if (newStock < 0) throw new ConflictException('Estoque não pode ser negativo');

    return this.prisma.product.update({
      where: { id },
      data: {
        stock: newStock,
        status: newStock === 0 ? 'OUT_OF_STOCK' : product.status === 'OUT_OF_STOCK' ? 'ACTIVE' : product.status,
      },
      select: { id: true, stock: true, status: true },
    });
  }

  async softDelete(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'INACTIVE' },
      select: { id: true, deletedAt: true },
    });
  }

  // ── Image management ──────────────────────────────────────────────

  async addImage(
    productId: string,
    userId: string,
    file: { buffer: Buffer; mimetype: string; size: number; originalname: string },
    baseUrl: string,
  ) {
    const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);
    if (!ALLOWED.has(file.mimetype))
      throw new BadRequestException('Tipo inválido. Use JPG, PNG ou WEBP.');
    if (file.size > 10 * 1024 * 1024)
      throw new BadRequestException('Arquivo muito grande. Máximo 10 MB.');

    await this.findOne(productId, userId);

    const uploadsDir = join(process.cwd(), 'uploads');
    if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });

    const extMap: Record<string, string> = {
      'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp',
    };
    const ext = extname(file.originalname).toLowerCase() || extMap[file.mimetype] || '.jpg';
    const filename = `product-${randomUUID()}${ext}`;
    writeFileSync(join(uploadsDir, filename), file.buffer);

    const count = await this.prisma.productImage.count({ where: { productId } });
    return this.prisma.productImage.create({
      data: { productId, url: `${baseUrl}/uploads/${filename}`, isPrimary: count === 0, sortOrder: count },
    });
  }

  async deleteImage(imageId: string, userId: string) {
    const image = await this.prisma.productImage.findUnique({
      where: { id: imageId },
      include: { product: { include: { supplier: { select: { userId: true } } } } },
    });
    if (!image) throw new NotFoundException('Imagem não encontrada');
    if (image.product.supplier.userId !== userId) throw new ForbiddenException();

    try {
      const filename = image.url.split('/uploads/').pop();
      if (filename) {
        const fp = join(process.cwd(), 'uploads', filename);
        if (existsSync(fp)) unlinkSync(fp);
      }
    } catch {}

    await this.prisma.productImage.delete({ where: { id: imageId } });

    if (image.isPrimary) {
      const next = await this.prisma.productImage.findFirst({
        where: { productId: image.productId },
        orderBy: { sortOrder: 'asc' },
      });
      if (next) await this.prisma.productImage.update({ where: { id: next.id }, data: { isPrimary: true } });
    }

    return { deleted: true };
  }

  async setPrimaryImage(imageId: string, productId: string, userId: string) {
    await this.findOne(productId, userId);
    const image = await this.prisma.productImage.findFirst({ where: { id: imageId, productId } });
    if (!image) throw new NotFoundException('Imagem não encontrada');

    await this.prisma.$transaction([
      this.prisma.productImage.updateMany({ where: { productId }, data: { isPrimary: false } }),
      this.prisma.productImage.update({ where: { id: imageId }, data: { isPrimary: true } }),
    ]);

    return this.prisma.productImage.findMany({ where: { productId }, orderBy: { sortOrder: 'asc' } });
  }
}
