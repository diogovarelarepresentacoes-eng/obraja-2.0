import { Controller, Get, Param, Query, Patch } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, UserStatus } from '@obraja/types';

@ApiTags('Users')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos os usuários (admin)' })
  @ApiQuery({ name: 'role', required: false, enum: UserRole })
  @ApiQuery({ name: 'status', required: false, enum: UserStatus })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(
    @Query('role') role?: UserRole,
    @Query('status') status?: UserStatus,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.usersService.findAll({ role, status, page: +page, limit: +limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhes de um usuário (admin)' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id/suspend')
  @ApiOperation({ summary: 'Suspender conta de usuário (admin)' })
  suspend(@Param('id') id: string) {
    return this.usersService.suspend(id);
  }
}
