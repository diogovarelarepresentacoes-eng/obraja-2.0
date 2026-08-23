import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, UserStatus } from '@obraja/types';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters: { role?: UserRole; status?: UserStatus; page?: number; limit?: number }) {
    const { role, status, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
      ...(role && { role }),
      ...(status && { status }),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, email: true, phone: true, role: true, status: true, createdAt: true,
          supplierProfile: { select: { companyName: true, cnpj: true } },
          contractorProfile: { select: { companyName: true, cnpj: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data: users, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id, deletedAt: null },
      select: {
        id: true, email: true, phone: true, role: true, status: true, createdAt: true,
        supplierProfile: { include: { address: true } },
        contractorProfile: { include: { address: true } },
        driverProfile: true,
        buyerProfile: { include: { addresses: true } },
        documents: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async suspend(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.SUSPENDED },
      select: { id: true, status: true },
    });
  }
}
