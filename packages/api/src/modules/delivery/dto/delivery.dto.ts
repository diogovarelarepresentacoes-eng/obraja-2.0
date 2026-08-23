import {
  IsBoolean, IsEmail, IsEnum, IsInt, IsNumber, IsOptional,
  IsString, IsUUID, Length, Max, Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DeliveryStatus, VehicleType } from '@obraja/types';

export class RegisterDriverDto {
  @ApiProperty({ example: 'João' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Silva' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: '123.456.789-09' })
  @IsString()
  cpf: string;

  @ApiProperty({ example: 'joao@email.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '(85) 99999-9999' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'Senha@123' })
  @IsString()
  @Length(8, 128)
  password: string;

  @ApiProperty({ enum: VehicleType })
  @IsEnum(VehicleType)
  vehicleType: VehicleType;

  @ApiProperty({ example: 'ABC1D23' })
  @IsString()
  @Length(7, 7)
  vehiclePlate: string;

  @ApiProperty({ example: 'Honda' })
  @IsString()
  vehicleBrand: string;

  @ApiProperty({ example: 'CG 160' })
  @IsString()
  vehicleModel: string;

  @ApiPropertyOptional({ example: 2022 })
  @IsOptional()
  @IsInt()
  @Min(1990)
  @Max(2030)
  vehicleYear?: number;

  @ApiPropertyOptional({ example: 'Vermelho' })
  @IsOptional()
  @IsString()
  vehicleColor?: string;
}

export class AssignDeliveryDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  subOrderId: string;

  @ApiPropertyOptional({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsOptional()
  @IsUUID()
  driverId?: string;
}

export class UpdateDeliveryStatusDto {
  @ApiProperty({ enum: DeliveryStatus })
  @IsEnum(DeliveryStatus)
  status: DeliveryStatus;

  @ApiPropertyOptional({ example: 'Destinatário ausente' })
  @IsOptional()
  @IsString()
  failedReason?: string;

  @ApiPropertyOptional({ example: 'https://storage.obraja.com/proof/xyz.jpg' })
  @IsOptional()
  @IsString()
  proofUrl?: string;
}

export class UpdateLocationDto {
  @ApiProperty({ example: -23.5505 })
  @IsNumber()
  lat: number;

  @ApiProperty({ example: -46.6333 })
  @IsNumber()
  lng: number;
}

export class UpdateDriverOnlineDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isOnline: boolean;
}
