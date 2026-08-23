import {
  IsEnum, IsOptional, IsString, IsObject, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@obraja/types';

class DeliveryAddressDto {
  @ApiProperty({ example: '01310-100' })
  @IsString() cep: string;

  @ApiProperty({ example: 'Avenida Paulista' })
  @IsString() street: string;

  @ApiProperty({ example: '1000' })
  @IsString() number: string;

  @ApiPropertyOptional({ example: 'Apto 42' })
  @IsOptional() @IsString() complement?: string;

  @ApiProperty({ example: 'Bela Vista' })
  @IsString() neighborhood: string;

  @ApiProperty({ example: 'São Paulo' })
  @IsString() city: string;

  @ApiProperty({ example: 'SP' })
  @IsString() state: string;
}

export class CreateOrderDto {
  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod) paymentMethod: PaymentMethod;

  @ApiPropertyOptional({ example: 'Entregar no período da tarde' })
  @IsOptional() @IsString() notes?: string;

  @ApiProperty({ type: DeliveryAddressDto })
  @IsObject()
  @ValidateNested()
  @Type(() => DeliveryAddressDto)
  deliveryAddress: DeliveryAddressDto;
}
