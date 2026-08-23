import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';
import { ProductStatus } from '@obraja/types';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @ApiPropertyOptional({ enum: ProductStatus })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
}

export class UpdateStockDto {
  @ApiPropertyOptional({ description: 'Novo valor absoluto do estoque' })
  @IsOptional() stock?: number;

  @ApiPropertyOptional({ description: 'Incremento/decremento relativo (ex: +10 ou -5)' })
  @IsOptional() delta?: number;
}
