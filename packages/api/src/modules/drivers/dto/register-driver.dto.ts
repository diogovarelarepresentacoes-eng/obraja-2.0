import { IsString, IsEmail, MinLength, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { VehicleType } from '@obraja/types';

export class RegisterDriverDto {
  @ApiProperty({ example: 'joao@email.com' })
  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;

  @ApiProperty({ example: 'senha12345' })
  @IsString()
  @MinLength(8, { message: 'Senha deve ter ao menos 8 caracteres' })
  password: string;

  @ApiProperty({ example: '(85) 99999-9999' })
  @IsString() phone: string;

  @ApiProperty({ example: 'João' })
  @IsString() firstName: string;

  @ApiProperty({ example: 'Silva' })
  @IsString() lastName: string;

  @ApiProperty({ example: '000.000.000-00' })
  @IsString() cpf: string;

  @ApiProperty({ enum: VehicleType })
  @IsEnum(VehicleType) vehicleType: VehicleType;

  @ApiProperty({ example: 'ABC-1234' })
  @IsString() vehiclePlate: string;

  @ApiProperty({ example: 'Honda' })
  @IsString() vehicleBrand: string;

  @ApiProperty({ example: 'CG 160' })
  @IsString() vehicleModel: string;

  @ApiProperty({ example: 2020 })
  @Type(() => Number)
  @IsInt()
  @Min(1990)
  @Max(2030)
  vehicleYear: number;

  @ApiProperty({ example: 'Vermelho' })
  @IsString() vehicleColor: string;
}
