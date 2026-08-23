import { Controller, Get, Post, Patch, Body, Req, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { SuppliersService } from './suppliers.service';
import { RegisterSupplierDto } from './dto/register-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@obraja/types';

@ApiTags('Suppliers')
@Controller('suppliers')
export class SuppliersController {
  constructor(private suppliersService: SuppliersService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Cadastro de novo fornecedor (loja ou fábrica)' })
  register(@Body() dto: RegisterSupplierDto) {
    return this.suppliersService.register(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @Roles(UserRole.SUPPLIER_STORE, UserRole.SUPPLIER_FACTORY)
  @ApiOperation({ summary: 'Meu perfil de fornecedor' })
  getMyProfile(@Req() req: Request) {
    const user = req.user as { id: string };
    return this.suppliersService.getMyProfile(user.id);
  }

  @Patch('me')
  @ApiBearerAuth()
  @Roles(UserRole.SUPPLIER_STORE, UserRole.SUPPLIER_FACTORY)
  @ApiOperation({ summary: 'Atualizar meu perfil de fornecedor' })
  updateProfile(@Req() req: Request, @Body() dto: UpdateSupplierDto) {
    const user = req.user as { id: string };
    return this.suppliersService.updateProfile(user.id, dto);
  }

  @Get('me/stats')
  @ApiBearerAuth()
  @Roles(UserRole.SUPPLIER_STORE, UserRole.SUPPLIER_FACTORY)
  @ApiOperation({ summary: 'Minhas estatísticas (produtos, pedidos)' })
  getStats(@Req() req: Request) {
    const user = req.user as { id: string };
    return this.suppliersService.getStats(user.id);
  }

  @Get()
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar todos os fornecedores (admin)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(@Query('page') page = '1', @Query('limit') limit = '20') {
    return this.suppliersService.findAll(+page, +limit);
  }
}
