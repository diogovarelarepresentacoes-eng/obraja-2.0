import {
  Controller, Get, Post, Patch, Body, Param, Query, Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { DeliveryService } from './delivery.service';
import {
  AssignDeliveryDto,
  RegisterDriverDto,
  UpdateDeliveryStatusDto,
  UpdateLocationDto,
  UpdateDriverOnlineDto,
} from './dto/delivery.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '@obraja/types';

interface AuthUser {
  id: string;
  role: UserRole;
}

@ApiTags('Delivery')
@ApiBearerAuth()
@Controller('delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Cadastro público de novo entregador' })
  register(@Body() dto: RegisterDriverDto) {
    return this.deliveryService.register(dto);
  }

  @Post('assign')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: criar e atribuir entrega a um sub-pedido' })
  assignDelivery(@Body() dto: AssignDeliveryDto) {
    return this.deliveryService.assignDelivery(dto);
  }

  @Get('available')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Motorista: listar entregas disponíveis (sem driver)' })
  getAvailableDeliveries() {
    return this.deliveryService.getAvailableDeliveries();
  }

  @Get('mine')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Motorista: minhas entregas' })
  @ApiQuery({ name: 'status', required: false, description: 'Filtrar por DeliveryStatus' })
  getMyDeliveries(@Req() req: Request, @Query('status') status?: string) {
    const user = req.user as AuthUser;
    return this.deliveryService.getMyDeliveries(user.id, status);
  }

  @Patch('driver/online')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Motorista: atualizar status online/offline' })
  setDriverOnline(@Req() req: Request, @Body() dto: UpdateDriverOnlineDto) {
    const user = req.user as AuthUser;
    return this.deliveryService.setDriverOnline(user.id, dto);
  }

  @Get('tracking/:subOrderId')
  @Public()
  @ApiOperation({ summary: 'Público: rastrear entrega por sub-pedido' })
  getDeliveryBySubOrder(@Param('subOrderId') subOrderId: string) {
    return this.deliveryService.getDeliveryBySubOrder(subOrderId);
  }

  @Post(':id/accept')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Motorista: aceitar entrega' })
  acceptDelivery(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as AuthUser;
    return this.deliveryService.acceptDelivery(id, user.id);
  }

  @Patch(':id/status')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Motorista: atualizar status da entrega' })
  updateStatus(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: UpdateDeliveryStatusDto,
  ) {
    const user = req.user as AuthUser;
    return this.deliveryService.updateStatus(id, user.id, dto);
  }

  @Patch(':id/location')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Motorista: atualizar localização GPS' })
  updateLocation(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: UpdateLocationDto,
  ) {
    const user = req.user as AuthUser;
    return this.deliveryService.updateLocation(id, user.id, dto);
  }
}
