import {
  IsString, IsNumber, IsOptional, IsInt, IsBoolean, Min, IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Cimento CP-II 50kg' })
  @IsString() name: string;

  @ApiPropertyOptional({ example: 'CIM-CP2-50' })
  @IsOptional() @IsString() sku?: string;

  @ApiPropertyOptional({ example: 'Cimento Portland CP-II resistente a sulfatos...' })
  @IsOptional() @IsString() description?: string;

  @ApiProperty({ description: 'ID da categoria' })
  @IsUUID() categoryId: string;

  @ApiProperty({ example: 38.90, description: 'Preço varejo (B2C)' })
  @IsNumber() @Min(0) price: number;

  @ApiPropertyOptional({ example: 32.00, description: 'Preço atacado (B2B — visível apenas para construtoras)' })
  @IsOptional() @IsNumber() @Min(0) b2bPrice?: number;

  @ApiPropertyOptional({ example: 100, description: 'Quantidade mínima por pedido (MOQ)' })
  @IsOptional() @IsInt() @Min(1) moq?: number;

  @ApiProperty({ example: 500, description: 'Estoque disponível' })
  @IsInt() @Min(0) stock: number;

  @ApiPropertyOptional({ example: 'saco', description: 'Unidade de medida: un, saco, m², m³, kg, L, rolo' })
  @IsOptional() @IsString() unit?: string;

  @ApiPropertyOptional({ example: 50, description: 'Peso em kg (para cálculo de frete)' })
  @IsOptional() @IsNumber() @Min(0) weightKg?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional() @IsNumber() @Min(0) widthCm?: number;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional() @IsNumber() @Min(0) heightCm?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional() @IsNumber() @Min(0) depthCm?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional() @IsBoolean() isHighlighted?: boolean;
}
