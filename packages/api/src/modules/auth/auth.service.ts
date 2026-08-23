import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserRole, UserStatus } from '@obraja/types';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('E-mail já cadastrado');

    const passwordHash = await argon2.hash(dto.password);
    const role = dto.role ?? UserRole.BUYER;
    const status = role === UserRole.BUYER ? UserStatus.APPROVED : UserStatus.PENDING_REVIEW;

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        phone: dto.phone,
        role,
        status,
        buyerProfile:
          role === UserRole.BUYER
            ? {
                create: {
                  firstName: dto.firstName,
                  lastName: dto.lastName,
                },
              }
            : undefined,
      },
      select: { id: true, email: true, role: true, status: true },
    });

    if (user.status === UserStatus.APPROVED) {
      return this.generateTokens(user.id, user.email, user.role);
    }

    return {
      message: 'Cadastro realizado! Aguardando análise da equipe ObraJá (até 48h).',
      status: UserStatus.PENDING_REVIEW,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email, deletedAt: null },
      select: { id: true, email: true, passwordHash: true, role: true, status: true },
    });

    if (!user) throw new UnauthorizedException('Credenciais inválidas');

    const passwordOk = await argon2.verify(user.passwordHash, dto.password);
    if (!passwordOk) throw new UnauthorizedException('Credenciais inválidas');

    if (user.status === UserStatus.PENDING_REVIEW)
      throw new UnauthorizedException('Cadastro aguardando aprovação');
    if (user.status === UserStatus.REJECTED)
      throw new UnauthorizedException('Cadastro reprovado — entre em contato com o suporte');
    if (user.status === UserStatus.SUSPENDED)
      throw new UnauthorizedException('Conta suspensa — entre em contato com o suporte');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.generateTokens(user.id, user.email, user.role);
  }

  async refresh(userId: string, email: string, role: string) {
    return this.generateTokens(userId, email, role);
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
    return { message: 'Logout realizado com sucesso' };
  }

  async me(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        buyerProfile: { select: { firstName: true, lastName: true, avatarUrl: true } },
        supplierProfile: { select: { companyName: true, tradeName: true, logoUrl: true } },
        contractorProfile: { select: { companyName: true } },
        driverProfile: { select: { firstName: true, lastName: true, isOnline: true } },
      },
    });
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow('JWT_SECRET'),
        expiresIn: this.config.get('JWT_EXPIRES_IN', '15m'),
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    ]);

    const tokenHash = await argon2.hash(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.upsert({
      where: { tokenHash },
      create: { userId, tokenHash, expiresAt },
      update: { expiresAt },
    });

    return { accessToken, refreshToken };
  }
}
