import { IsString, IsObject, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class AsaasPaymentDataDto {
  @ApiProperty({ example: 'pay_abc123' })
  @IsString()
  id: string;

  @ApiProperty({ example: 'CONFIRMED' })
  @IsString()
  status: string;

  @ApiPropertyOptional({ example: 'https://sandbox.asaas.com/i/xyz' })
  @IsOptional()
  @IsString()
  invoiceUrl?: string;
}

export class AsaasWebhookDto {
  @ApiProperty({ example: 'PAYMENT_CONFIRMED' })
  @IsString()
  event: string;

  @ApiProperty({ type: AsaasPaymentDataDto })
  @IsObject()
  @ValidateNested()
  @Type(() => AsaasPaymentDataDto)
  payment: AsaasPaymentDataDto;
}
