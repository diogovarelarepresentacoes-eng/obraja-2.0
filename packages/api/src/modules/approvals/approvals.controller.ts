import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ApprovalsService } from './approvals.service';
import { ReviewApprovalDto, ApproveDto } from './dto/review-approval.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@obraja/types';

@ApiTags('Approvals')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('approvals')
export class ApprovalsController {
  constructor(private approvalsService: ApprovalsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar cadastros pendentes de aprovação' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findPending(@Query('page') page = '1', @Query('limit') limit = '20') {
    return this.approvalsService.findPending(+page, +limit);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Estatísticas do painel admin' })
  stats() {
    return this.approvalsService.stats();
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Detalhes de um cadastro pendente' })
  findOne(@Param('userId') userId: string) {
    return this.approvalsService.findOne(userId);
  }

  @Post(':userId/approve')
  @ApiOperation({ summary: 'Aprovar cadastro (e definir crédito B2B se for construtora)' })
  approve(@Param('userId') userId: string, @Body() dto: ApproveDto) {
    return this.approvalsService.approve(userId, dto);
  }

  @Post(':userId/reject')
  @ApiOperation({ summary: 'Reprovar cadastro com motivo obrigatório' })
  reject(@Param('userId') userId: string, @Body() dto: ReviewApprovalDto) {
    return this.approvalsService.reject(userId, dto);
  }
}
