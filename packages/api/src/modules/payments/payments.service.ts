import {
  Injectable,
  NotFoundException,
  BadGatewayException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AsaasWebhookDto } from './dto/payment.dto';
import { OrderStatus, PaymentMethod } from '@obraja/types';

interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
}

interface AsaasCustomerListResponse {
  data: AsaasCustomer[];
}

interface AsaasPayment {
  id: string;
  invoiceUrl: string;
  billingType: string;
  status: string;
}

interface AsaasPixQrCode {
  encodedImage: string;
  payload: string;
  expirationDate: string;
}

export interface CreatePaymentResult {
  paymentId: string;
  invoiceUrl: string;
  pixQrCode?: AsaasPixQrCode;
}

export interface PaymentStatusResult {
  status: string;
  asaasPaymentId: string | null;
  asaasInvoiceUrl: string | null;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  private get baseUrl(): string {
    const env = process.env.ASAAS_ENVIRONMENT ?? 'sandbox';
    return env === 'production'
      ? 'https://api.asaas.com/api/v3'
      : 'https://sandbox.asaas.com/api/v3';
  }

  private async asaasRequest<T>(
    method: string,
    path: string,
    body?: Record<string, unknown>,
  ): Promise<T> {
    const apiKey = process.env.ASAAS_API_KEY;
    if (!apiKey) {
      throw new BadGatewayException('ASAAS_API_KEY não configurado');
    }

    const url = `${this.baseUrl}${path}`;
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        access_token: apiKey,
      },
    };

    if (body !== undefined) {
      options.body = JSON.stringify(body);
    }

    let response: Response;
    try {
      response = await fetch(url, options);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new BadGatewayException(`Erro ao conectar com Asaas: ${message}`);
    }

    if (!response.ok) {
      let errorMessage = `Asaas retornou status ${response.status}`;
      try {
        const errorBody = await response.json() as { errors?: Array<{ description?: string }> };
        const firstError = errorBody?.errors?.[0]?.description;
        if (firstError) errorMessage = firstError;
      } catch {
        // ignore JSON parse error, use default message
      }
      throw new BadGatewayException(errorMessage);
    }

    return response.json() as Promise<T>;
  }

  private async upsertAsaasCustomer(
    email: string,
    phone: string | null,
  ): Promise<AsaasCustomer> {
    const existing = await this.asaasRequest<AsaasCustomerListResponse>(
      'GET',
      `/customers?email=${encodeURIComponent(email)}`,
    );

    if (existing.data.length > 0) {
      return existing.data[0];
    }

    return this.asaasRequest<AsaasCustomer>('POST', '/customers', {
      name: email,
      email,
      cpfCnpj: email, // placeholder — real CPF/CNPJ to be added later
      mobilePhone: phone ?? '',
    });
  }

  private getDueDate(daysFromNow: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0];
  }

  async createPayment(orderId: string, requestingUserId: string): Promise<CreatePaymentResult> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: { id: true, email: true, phone: true },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Pedido ${orderId} não encontrado`);
    }

    if (order.userId !== requestingUserId) {
      throw new NotFoundException(`Pedido ${orderId} não encontrado`);
    }

    const customer = await this.upsertAsaasCustomer(
      order.user.email,
      order.user.phone,
    );

    const description = `Pedido ObraJá #${orderId}`;
    const value = order.totalAmount;

    let paymentBody: Record<string, unknown>;

    switch (order.paymentMethod as PaymentMethod) {
      case PaymentMethod.PIX:
        paymentBody = {
          customer: customer.id,
          billingType: 'PIX',
          dueDate: this.getDueDate(1),
          value,
          description,
        };
        break;

      case PaymentMethod.BOLETO:
        paymentBody = {
          customer: customer.id,
          billingType: 'BOLETO',
          dueDate: this.getDueDate(3),
          value,
          description,
        };
        break;

      case PaymentMethod.CREDIT_CARD:
        paymentBody = {
          customer: customer.id,
          billingType: 'CREDIT_CARD',
          dueDate: this.getDueDate(1),
          value,
          description,
        };
        break;

      default:
        paymentBody = {
          customer: customer.id,
          billingType: 'PIX',
          dueDate: this.getDueDate(1),
          value,
          description,
        };
    }

    const payment = await this.asaasRequest<AsaasPayment>('POST', '/payments', paymentBody);

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        asaasPaymentId: payment.id,
        asaasInvoiceUrl: payment.invoiceUrl,
      },
    });

    const result: CreatePaymentResult = {
      paymentId: payment.id,
      invoiceUrl: payment.invoiceUrl,
    };

    if (order.paymentMethod === PaymentMethod.PIX) {
      try {
        const pixQrCode = await this.asaasRequest<AsaasPixQrCode>(
          'GET',
          `/payments/${payment.id}/pixQrCode`,
        );
        result.pixQrCode = pixQrCode;
      } catch (err) {
        this.logger.warn(`Não foi possível obter QR Code PIX para ${payment.id}: ${err}`);
      }
    }

    return result;
  }

  async handleWebhook(dto: AsaasWebhookDto): Promise<void> {
    const { event, payment } = dto;

    this.logger.log(`Webhook Asaas recebido: ${event} para payment ${payment.id}`);

    if (event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_RECEIVED') {
      await this.prisma.order.updateMany({
        where: { asaasPaymentId: payment.id },
        data: { status: OrderStatus.PAYMENT_CONFIRMED },
      });
      this.logger.log(`Pedido com asaasPaymentId=${payment.id} marcado como PAYMENT_CONFIRMED`);
      return;
    }

    if (event === 'PAYMENT_OVERDUE') {
      this.logger.warn(`Pagamento vencido: ${payment.id}`);
      return;
    }

    if (event === 'PAYMENT_DELETED' || event === 'PAYMENT_REFUNDED') {
      // REFUNDED is not in OrderStatus enum — both map to CANCELLED
      await this.prisma.order.updateMany({
        where: { asaasPaymentId: payment.id },
        data: { status: OrderStatus.CANCELLED },
      });
      this.logger.log(
        `Pedido com asaasPaymentId=${payment.id} marcado como CANCELLED (evento: ${event})`,
      );
      return;
    }

    this.logger.log(`Evento Asaas não tratado: ${event}`);
  }

  async getPaymentStatus(orderId: string, userId: string): Promise<PaymentStatusResult> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        userId: true,
        status: true,
        asaasPaymentId: true,
        asaasInvoiceUrl: true,
      },
    });

    if (!order || order.userId !== userId) {
      throw new NotFoundException(`Pedido ${orderId} não encontrado`);
    }

    return {
      status: order.status,
      asaasPaymentId: order.asaasPaymentId,
      asaasInvoiceUrl: order.asaasInvoiceUrl,
    };
  }
}
