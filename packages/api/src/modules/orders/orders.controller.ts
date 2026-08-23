import {
  Controller, Get, Post, Patch, Body, Param, Query, Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateSubOrderStatusDto } from './dto/update-order.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@obraja/types';

interface AuthUser {
  id: string;
  role: UserRole;
}

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Get('supplier')
  @Roles(UserRole.SUPPLIER_STORE, UserRole.SUPPLIER_FACTORY)
  @ApiOperation({ summary: 'Sub-pedidos do fornecedor autenticado' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findSupplierOrders(
    @Req() req: Request,
    @Query('status') status?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const user = req.user as AuthUser;
    return this.ordersService.findSupplierOrdersByUserId(user.id, status, +page, +limit);
  }

  @Get('admin')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Todos os pedidos (admin)' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAllOrders(
    @Query('status') status?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.ordersService.findAllOrders(+page, +limit, status);
  }

  @Post()
  @Roles(UserRole.BUYER, UserRole.CONTRACTOR)
  @ApiOperation({ summary: 'Criar pedido a partir do carrinho' })
  createFromCart(@Req() req: Request, @Body() dto: CreateOrderDto) {
    const user = req.user as AuthUser;
    return this.ordersService.createFromCart(user.id, user.role, dto);
  }

  @Get()
  @Roles(UserRole.BUYER, UserRole.CONTRACTOR)
  @ApiOperation({ summary: 'Meus pedidos' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findMyOrders(
    @Req() req: Request,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    const user = req.user as AuthUser;
    return this.ordersService.findMyOrders(user.id, +page, +limit);
  }

  @Patch('suborders/:id/status')
  @Roles(UserRole.SUPPLIER_STORE, UserRole.SUPPLIER_FACTORY)
  @ApiOperation({ summary: 'Atualizar status do sub-pedido' })
  updateSubOrderStatus(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateSubOrderStatusDto,
  ) {
    const user = req.user as AuthUser;
    return this.ordersService.updateSubOrderStatusByUserId(id, user.id, dto);
  }

  @Get(':id')
  @Roles(UserRole.BUYER, UserRole.CONTRACTOR)
  @ApiOperation({ summary: 'Detalhes de um pedido' })
  findOne(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as AuthUser;
    return this.ordersService.findOne(id, user.id);
  }
}
