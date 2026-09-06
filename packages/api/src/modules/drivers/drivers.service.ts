import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDriverDto } from './dto/register-driver.dto';
import { UserStatus, UserRole } from '@obraja/types';

function cleanCpf(cpf: string) {
  return cpf.replace(/[^\d]/g, '');
}

function isValidCpf(raw: string): boolean {
  const cpf = cleanCpf(raw);
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(cpf[i]) * (10 - i);
  let rem = (sum * 10) % 11;
  if (rem === 10 || rem === 11) rem = 0;
  if (rem !== Number(cpf[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += Number(cpf[i]) * (11 - i);
  rem = (sum * 10) % 11;
  if (rem === 10 || rem === 11) rem = 0;
  return rem === Number(cpf[10]);
}

@Injectable()
export class DriversService {
  constructor(private prisma: PrismaService) {}

  async register(dto: RegisterDriverDto) {
    if (!isValidCpf(dto.cpf)) {
      throw new ConflictException('CPF inválido');
    }

    const cpf = cleanCpf(dto.cpf);
    const vehiclePlate = dto.vehiclePlate.toUpperCase().replace(/[^A-Z0-9]/g, '');

    const [emailExists, cpfExists, plateExists] = await Promise.all([
      this.prisma.user.findUnique({ where: { email: dto.email } }),
      this.prisma.driverProfile.findUnique({ where: { cpf } }),
      this.prisma.driverProfile.findUnique({ where: { vehiclePlate } }),
    ]);

    if (emailExists) throw new ConflictException('E-mail já cadastrado');
    if (cpfExists) throw new ConflictException('CPF já cadastrado');
    if (plateExists) throw new ConflictException('Placa de veículo já cadastrada');

    const passwordHash = await argon2.hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        phone: dto.phone,
        role: UserRole.DRIVER,
        status: UserStatus.PENDING_REVIEW,
        driverProfile: {
          create: {
            cpf,
            firstName: dto.firstName,
            lastName: dto.lastName,
            vehicleType: dto.vehicleType,
            vehiclePlate,
            vehicleBrand: dto.vehicleBrand,
            vehicleModel: dto.vehicleModel,
            vehicleYear: dto.vehicleYear,
            vehicleColor: dto.vehicleColor,
          },
        },
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        driverProfile: { select: { firstName: true, lastName: true, cpf: true } },
      },
    });

    return {
      message: 'Cadastro realizado! Aguardando análise da equipe ObraJá (até 48h úteis). Envie os documentos obrigatórios: CNH (frente e verso), CRLV e selfie com documento.',
      userId: user.id,
      status: UserStatus.PENDING_REVIEW,
      requiredDocuments: ['CNH_FRENTE', 'CNH_VERSO', 'CRLV', 'SELFIE_DOCUMENTO'],
    };
  }

  async getMyProfile(userId: string) {
    const driver = await this.prisma.driverProfile.findUnique({
      where: { userId },
      include: {
        user: { select: { email: true, phone: true, status: true } },
      },
    });

    if (!driver) throw new NotFoundException('Perfil de entregador não encontrado');
    return driver;
  }

  async findAll(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [drivers, total] = await Promise.all([
      this.prisma.driverProfile.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { email: true, status: true } },
        },
      }),
      this.prisma.driverProfile.count(),
    ]);

    return { data: drivers, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
