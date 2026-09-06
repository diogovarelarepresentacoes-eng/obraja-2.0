import { Controller, Get, Post, Body, Req, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { DriversService } from './drivers.service';
import { RegisterDriverDto } from './dto/register-driver.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@obraja/types';

@ApiTags('Drivers')
@Controller('drivers')
export class DriversController {
  constructor(private driversService: DriversService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Cadastro de novo entregador' })
  register(@Body() dto: RegisterDriverDto) {
    return this.driversService.register(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Meu perfil de entregador' })
  getMyProfile(@Req() req: Request) {
    const user = req.user as { id: string };
    return this.driversService.getMyProfile(user.id);
  }

  @Get()
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar todos os entregadores (admin)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(@Query('page') page = '1', @Query('limit') limit = '20') {
    return this.driversService.findAll(+page, +limit);
  }
}
