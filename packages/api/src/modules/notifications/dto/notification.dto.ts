import {
  IsArray,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNotificationDto {
  @ApiProperty({ description: 'ID do usuário destinatário', format: 'uuid' })
  @IsUUID()
  userId!: string;

  @ApiProperty({ description: 'Título da notificação' })
  @IsString()
  title!: string;

  @ApiProperty({ description: 'Corpo da notificação' })
  @IsString()
  body!: string;

  @ApiProperty({ description: 'Tipo da notificação (ex: ORDER_STATUS, PAYMENT, etc.)' })
  @IsString()
  type!: string;

  @ApiPropertyOptional({ description: 'Dados adicionais em JSON' })
  @IsObject()
  @IsOptional()
  data?: Record<string, unknown>;
}

export class MarkReadDto {
  @ApiProperty({
    description: 'Lista de IDs das notificações a marcar como lidas',
    type: [String],
    format: 'uuid',
  })
  @IsArray()
  @IsUUID('all', { each: true })
  ids!: string[];
}
