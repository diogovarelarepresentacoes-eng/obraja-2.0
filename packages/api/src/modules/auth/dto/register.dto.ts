import { IsEmail, IsString, MinLength, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@obraja/types';

// /auth/register é exclusivo para compradores (BUYER).
// Fornecedores → POST /suppliers/register
// Construtoras  → POST /contractors/register
// Entregadores  → POST /drivers/register
export class RegisterDto {
  @ApiProperty({ example: 'joao@email.com' })
  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;

  @ApiProperty({ example: 'senha12345' })
  @IsString()
  @MinLength(8, { message: 'Senha deve ter ao menos 8 caracteres' })
  password: string;

  @ApiProperty({ example: 'João' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Silva' })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({ example: '(85) 99999-9999' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ enum: [UserRole.BUYER], default: UserRole.BUYER })
  @IsOptional()
  @IsIn([UserRole.BUYER], { message: 'Use o endpoint específico para cadastro de fornecedores, construtoras ou entregadores' })
  role?: UserRole.BUYER;
}
