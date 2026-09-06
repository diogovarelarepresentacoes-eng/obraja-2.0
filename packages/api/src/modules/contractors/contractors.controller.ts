import { Controller, Get, Post, Body, Req, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { ContractorsService } from './contractors.service';
import { RegisterContractorDto } from './dto/register-contractor.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@obraja/types';

@ApiTags('Contractors')
@Controller('contractors')
export class ContractorsController {
  constructor(private contractorsService: ContractorsService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Cadastro de nova construtora (B2B)' })
  register(@Body() dto: RegisterContractorDto) {
    return this.contractorsService.register(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @Roles(UserRole.CONTRACTOR)
  @ApiOperation({ summary: 'Meu perfil de construtora' })
  getMyProfile(@Req() req: Request) {
    const user = req.user as { id: string };
    return this.contractorsService.getMyProfile(user.id);
  }

  @Get()
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar todas as construtoras (admin)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(@Query('page') page = '1', @Query('limit') limit = '20') {
    return this.contractorsService.findAll(+page, +limit);
  }
}
