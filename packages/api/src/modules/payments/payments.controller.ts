import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Req,
  Logger,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { PaymentsService, CreatePaymentResult, PaymentStatusResult } from './payments.service';
import { AsaasWebhookDto } from './dto/payment.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '@obraja/types';

interface AuthUser {
  id: string;
  role: UserRole;
}

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('orders/:orderId')
  @Roles(UserRole.BUYER, UserRole.CONTRACTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar pagamento Asaas para um pedido' })
  createPayment(
    @Req() req: Request,
    @Param('orderId') orderId: string,
  ): Promise<CreatePaymentResult> {
    const user = req.user as AuthUser;
    return this.paymentsService.createPayment(orderId, user.id);
  }

  @Post('webhook')
  @Public()
  @ApiOperation({ summary: 'Webhook Asaas — notificações de pagamento' })
  async handleWebhook(
    @Body() dto: AsaasWebhookDto,
    @Headers('asaas-signature') _signature?: string,
  ) {
    // TODO: in production, verify asaas-signature header against payload hash
    this.logger.log(`Webhook recebido: evento=${dto.event}`);
    await this.paymentsService.handleWebhook(dto);
    return { received: true };
  }

  @Get('orders/:orderId')
  @Roles(UserRole.BUYER, UserRole.CONTRACTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Consultar status de pagamento de um pedido' })
  getPaymentStatus(
    @Req() req: Request,
    @Param('orderId') orderId: string,
  ): Promise<PaymentStatusResult> {
    const user = req.user as AuthUser;
    return this.paymentsService.getPaymentStatus(orderId, user.id);
  }
}
