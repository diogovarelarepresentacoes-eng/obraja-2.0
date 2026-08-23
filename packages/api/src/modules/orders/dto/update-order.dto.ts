import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SubOrderStatus } from '@obraja/types';

export class UpdateSubOrderStatusDto {
  @ApiProperty({ enum: SubOrderStatus })
  @IsEnum(SubOrderStatus) status: SubOrderStatus;
}
