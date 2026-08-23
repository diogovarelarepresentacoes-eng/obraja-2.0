import { IsString, IsOptional, IsInt, Min, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Cimento e Argamassa' })
  @IsString() name: string;

  @ApiProperty({ example: 'cimento-e-argamassa' })
  @IsString() slug: string;

  @ApiPropertyOptional() @IsOptional() @IsString() parentId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() imageUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) sortOrder?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}
