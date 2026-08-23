import { IsUUID, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddToCartDto {
  @ApiProperty({ description: 'ID do produto' })
  @IsUUID() productId: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsInt() @Min(1) quantity: number = 1;
}

export class UpdateCartItemDto {
  @ApiProperty({ description: 'Nova quantidade (0 remove o item)', minimum: 0 })
  @IsInt() @Min(0) quantity: number;
}
