import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto, UpdateStockDto } from './dto/update-product.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@obraja/types';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  // ── Rotas públicas (sem autenticação) ──────────────────────────────

  @Public()
  @Get()
  @ApiOperation({ summary: 'Catálogo público de produtos' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'supplierId', required: false })
  @ApiQuery({ name: 'minPrice', required: false })
  @ApiQuery({ name: 'maxPrice', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findPublic(
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('supplierId') supplierId?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '24',
  ) {
    return this.productsService.findPublic({
      search,
      categoryId,
      supplierId,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      page: +page,
      limit: +limit,
    });
  }

  // ── Rotas do fornecedor (autenticado) ─────────────────────────────

  @Get('mine')
  @ApiBearerAuth()
  @Roles(UserRole.SUPPLIER_STORE, UserRole.SUPPLIER_FACTORY)
  @ApiOperation({ summary: 'Meus produtos (fornecedor)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findMine(
    @Req() req: Request,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    const user = req.user as { id: string };
    return this.productsService.findMine(user.id, +page, +limit);
  }

  @Post()
  @ApiBearerAuth()
  @Roles(UserRole.SUPPLIER_STORE, UserRole.SUPPLIER_FACTORY)
  @ApiOperation({ summary: 'Criar novo produto' })
  create(@Req() req: Request, @Body() dto: CreateProductDto) {
    const user = req.user as { id: string };
    return this.productsService.create(user.id, dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles(UserRole.SUPPLIER_STORE, UserRole.SUPPLIER_FACTORY)
  @ApiOperation({ summary: 'Atualizar produto' })
  update(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdateProductDto) {
    const user = req.user as { id: string };
    return this.productsService.update(id, user.id, dto);
  }

  @Patch(':id/stock')
  @ApiBearerAuth()
  @Roles(UserRole.SUPPLIER_STORE, UserRole.SUPPLIER_FACTORY)
  @ApiOperation({ summary: 'Atualizar estoque do produto' })
  updateStock(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdateStockDto) {
    const user = req.user as { id: string };
    return this.productsService.updateStock(id, user.id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Roles(UserRole.SUPPLIER_STORE, UserRole.SUPPLIER_FACTORY)
  @ApiOperation({ summary: 'Remover produto (soft delete)' })
  remove(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as { id: string };
    return this.productsService.softDelete(id, user.id);
  }

  // ── Rota pública por slug — DEVE vir DEPOIS de /mine ──────────────

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Detalhes de produto pelo slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }
}
