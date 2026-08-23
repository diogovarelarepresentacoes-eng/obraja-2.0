import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSupplierDto {
  @ApiPropertyOptional() @IsOptional() @IsString() tradeName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() logoUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() coverUrl?: string;
}
