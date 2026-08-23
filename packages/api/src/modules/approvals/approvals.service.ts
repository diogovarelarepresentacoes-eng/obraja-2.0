import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReviewApprovalDto, ApproveDto } from './dto/review-approval.dto';
import { UserStatus, UserRole } from '@obraja/types';

@Injectable()
export class ApprovalsService {
  constructor(private prisma: PrismaService) {}

  async findPending(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const where = { status: UserStatus.PENDING_REVIEW, deletedAt: null };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
        select: {
          id: true, email: true, phone: true, role: true, status: true, createdAt: true,
          supplierProfile: { select: { companyName: true, tradeName: true, cnpj: true, phone: true } },
          contractorProfile: { select: { companyName: true, cnpj: true, phone: true } },
          driverProfile: { select: { firstName: true, lastName: true, cpf: true, vehicleType: true } },
          documents: { select: { id: true, type: true, fileUrl: true, status: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data: users, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, phone: true, role: true, status: true, createdAt: true,
        supplierProfile: { include: { address: true } },
        contractorProfile: { include: { address: true } },
        driverProfile: true,
        documents: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async approve(userId: string, dto: ApproveDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, status: true, contractorProfile: { select: { id: true } } },
    });

    if (!user) throw new NotFoundException('Usuário não encontrado');

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { status: UserStatus.APPROVED },
      });

      if (
        user.role === UserRole.CONTRACTOR &&
        dto.creditLimit !== undefined &&
        user.contractorProfile
      ) {
        await tx.contractorProfile.update({
          where: { id: user.contractorProfile.id },
          data: { creditLimit: dto.creditLimit ?? 0 },
        });
      }

      await tx.document.updateMany({
        where: { userId, status: 'PENDING' },
        data: { status: 'APPROVED', reviewedAt: new Date() },
      });
    });

    return { message: 'Cadastro aprovado com sucesso' };
  }

  async reject(userId: string, dto: ReviewApprovalDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { status: UserStatus.REJECTED },
      });

      await tx.document.updateMany({
        where: { userId, status: 'PENDING' },
        data: { status: 'REJECTED', reviewedAt: new Date(), rejectionReason: dto.reason },
      });
    });

    return { message: 'Cadastro reprovado' };
  }

  async stats() {
    const businessRoles = [
      UserRole.SUPPLIER_STORE,
      UserRole.SUPPLIER_FACTORY,
      UserRole.CONTRACTOR,
      UserRole.DRIVER,
    ];

    const [pending, approved, rejected, buyers, total] = await Promise.all([
      this.prisma.user.count({ where: { status: UserStatus.PENDING_REVIEW, deletedAt: null } }),
      this.prisma.user.count({
        where: { status: UserStatus.APPROVED, role: { in: businessRoles }, deletedAt: null },
      }),
      this.prisma.user.count({ where: { status: UserStatus.REJECTED, deletedAt: null } }),
      this.prisma.user.count({ where: { role: UserRole.BUYER, deletedAt: null } }),
      this.prisma.user.count({ where: { deletedAt: null } }),
    ]);

    return { pending, approved, rejected, buyers, total };
  }
}
