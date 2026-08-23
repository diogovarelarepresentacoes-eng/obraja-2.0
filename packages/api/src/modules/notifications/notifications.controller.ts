import {
  Controller,
  Get,
  Patch,
  Body,
  Query,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { NotificationsService } from './notifications.service';
import { MarkReadDto } from './dto/notification.dto';
import { UserRole } from '@obraja/types';

interface AuthUser {
  id: string;
  role: UserRole;
}

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('unread-count')
  @ApiOperation({ summary: 'Quantidade de notificações não lidas do usuário' })
  getUnreadCount(@Req() req: Request) {
    const user = req.user as AuthUser;
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Patch('read')
  @ApiOperation({ summary: 'Marcar notificações específicas como lidas' })
  markRead(@Req() req: Request, @Body() dto: MarkReadDto) {
    const user = req.user as AuthUser;
    return this.notificationsService.markRead(user.id, dto.ids);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Marcar todas as notificações do usuário como lidas' })
  markAllRead(@Req() req: Request) {
    const user = req.user as AuthUser;
    return this.notificationsService.markAllRead(user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar notificações do usuário (paginado)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Req() req: Request,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const user = req.user as AuthUser;
    return this.notificationsService.findUserNotifications(
      user.id,
      +page,
      +limit,
    );
  }
}
