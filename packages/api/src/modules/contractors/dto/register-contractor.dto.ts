import {
  IsString, IsEmail, MinLength, IsOptional, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class AddressDto {
  @ApiProperty({ example: '60000-000' })
  @IsString() cep: string;

  @ApiProperty({ example: 'Rua das Flores' })
  @IsString() street: string;

  @ApiProperty({ example: '123' })
  @IsString() number: string;

  @ApiPropertyOptional({ example: 'Sala 2' })
  @IsOptional() @IsString() complement?: string;

  @ApiProperty({ example: 'Centro' })
  @IsString() neighborhood: string;

  @ApiProperty({ example: 'Fortaleza' })
  @IsString() city: string;

  @ApiProperty({ example: 'CE' })
  @IsString() state: string;
}

export class RegisterContractorDto {
  @ApiProperty({ example: 'construtora@empresa.com' })
  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;

  @ApiProperty({ example: 'senha12345' })
  @IsString()
  @MinLength(8, { message: 'Senha deve ter ao menos 8 caracteres' })
  password: string;

  @ApiProperty({ example: '(85) 99999-9999' })
  @IsString() phone: string;

  @ApiProperty({ example: 'Construtora ABC Ltda' })
  @IsString() companyName: string;

  @ApiProperty({ example: '12.345.678/0001-99' })
  @IsString() cnpj: string;

  @ApiPropertyOptional({ example: '12345678-9' })
  @IsOptional() @IsString() ie?: string;

  @ApiProperty({ type: AddressDto })
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;
}
