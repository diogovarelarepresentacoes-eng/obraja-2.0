import { IsString, MinLength, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReviewApprovalDto {
  @ApiProperty({ example: 'Documento não legível. Reenvie o contrato social.' })
  @IsString()
  @MinLength(10, { message: 'Informe um motivo com ao menos 10 caracteres' })
  reason: string;
}

export class ApproveDto {
  @ApiPropertyOptional({ example: 50000, description: 'Limite de crédito B2B (apenas para construtoras)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  creditLimit?: number;
}
