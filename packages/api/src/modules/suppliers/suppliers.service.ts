import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterSupplierDto } from './dto/register-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { UserStatus } from '@obraja/types';

function cleanCnpj(cnpj: string) {
  return cnpj.replace(/[^\d]/g, '');
}

function isValidCnpj(raw: string): boolean {
  const cnpj = cleanCnpj(raw);
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;

  const calc = (len: number) => {
    let sum = 0;
    let pos = len - 7;
    for (let i = len; i >= 1; i--) {
      sum += Number(cnpj[len - i]) * pos--;
      if (pos < 2) pos = 9;
    }
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };

  return Number(cnpj[12]) === calc(12) && Number(cnpj[13]) === calc(13);
}

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  async register(dto: RegisterSupplierDto) {
    if (!isValidCnpj(dto.cnpj)) {
      throw new ConflictException('CNPJ inválido');
    }

    const cnpj = cleanCnpj(dto.cnpj);

    const [emailExists, cnpjExists] = await Promise.all([
      this.prisma.user.findUnique({ where: { email: dto.email } }),
      this.prisma.supplierProfile.findUnique({ where: { cnpj } }),
    ]);

    if (emailExists) throw new ConflictException('E-mail já cadastrado');
    if (cnpjExists) throw new ConflictException('CNPJ já cadastrado');

    const passwordHash = await argon2.hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        phone: dto.phone,
        role: dto.role,
        status: UserStatus.PENDING_REVIEW,
        supplierProfile: {
          create: {
            companyName: dto.companyName,
            tradeName: dto.tradeName,
            cnpj,
            ie: dto.ie,
            phone: dto.phone,
            address: { create: dto.address },
          },
        },
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        supplierProfile: { select: { companyName: true, cnpj: true } },
      },
    });

    return {
      message: 'Cadastro realizado! Aguardando análise da equipe ObraJá (até 48h úteis).',
      userId: user.id,
      status: UserStatus.PENDING_REVIEW,
    };
  }

  async getMyProfile(userId: string) {
    const supplier = await this.prisma.supplierProfile.findUnique({
      where: { userId },
      include: { address: true, user: { select: { email: true, phone: true, status: true } } },
    });

    if (!supplier) throw new NotFoundException('Perfil de fornecedor não encontrado');
    return supplier;
  }

  async updateProfile(userId: string, dto: UpdateSupplierDto) {
    const supplier = await this.prisma.supplierProfile.findUnique({ where: { userId } });
    if (!supplier) throw new NotFoundException('Perfil de fornecedor não encontrado');

    return this.prisma.supplierProfile.update({
      where: { userId },
      data: dto,
    });
  }

  async getStats(userId: string) {
    const supplier = await this.prisma.supplierProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!supplier) throw new ForbiddenException();

    const [products, pendingOrders, completedOrders] = await Promise.all([
      this.prisma.product.count({ where: { supplierId: supplier.id, deletedAt: null } }),
      this.prisma.subOrder.count({
        where: { supplierId: supplier.id, status: 'AWAITING_SEPARATION' },
      }),
      this.prisma.subOrder.count({
        where: { supplierId: supplier.id, status: 'DELIVERED' },
      }),
    ]);

    return { products, pendingOrders, completedOrders };
  }

  async findAll(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [suppliers, total] = await Promise.all([
      this.prisma.supplierProfile.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          address: true,
          user: { select: { email: true, status: true, role: true } },
        },
      }),
      this.prisma.supplierProfile.count(),
    ]);

    return { data: suppliers, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
