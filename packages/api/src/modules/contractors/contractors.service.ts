import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterContractorDto } from './dto/register-contractor.dto';
import { UserStatus, UserRole } from '@obraja/types';

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
export class ContractorsService {
  constructor(private prisma: PrismaService) {}

  async register(dto: RegisterContractorDto) {
    if (!isValidCnpj(dto.cnpj)) {
      throw new BadRequestException('CNPJ inválido');
    }

    const cnpj = cleanCnpj(dto.cnpj);

    const [emailExists, cnpjExists] = await Promise.all([
      this.prisma.user.findUnique({ where: { email: dto.email } }),
      this.prisma.contractorProfile.findUnique({ where: { cnpj } }),
    ]);

    if (emailExists) throw new ConflictException('E-mail já cadastrado');
    if (cnpjExists) throw new ConflictException('CNPJ já cadastrado');

    const passwordHash = await argon2.hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        phone: dto.phone,
        role: UserRole.CONTRACTOR,
        status: UserStatus.PENDING_REVIEW,
        contractorProfile: {
          create: {
            companyName: dto.companyName,
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
        contractorProfile: { select: { companyName: true, cnpj: true } },
      },
    });

    return {
      message: 'Cadastro realizado! Aguardando análise da equipe ObraJá (até 48h úteis). Envie os documentos obrigatórios: Contrato Social e Cartão CNPJ.',
      userId: user.id,
      status: UserStatus.PENDING_REVIEW,
      requiredDocuments: ['CONTRATO_SOCIAL', 'CNPJ'],
      optionalDocuments: ['INSCRICAO_ESTADUAL'],
    };
  }

  async getMyProfile(userId: string) {
    const contractor = await this.prisma.contractorProfile.findUnique({
      where: { userId },
      include: {
        address: true,
        user: { select: { email: true, phone: true, status: true } },
      },
    });

    if (!contractor) throw new NotFoundException('Perfil de construtora não encontrado');
    return contractor;
  }

  async findAll(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [contractors, total] = await Promise.all([
      this.prisma.contractorProfile.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          address: true,
          user: { select: { email: true, status: true } },
        },
      }),
      this.prisma.contractorProfile.count(),
    ]);

    return { data: contractors, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
