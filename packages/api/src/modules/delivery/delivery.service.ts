import {
  Injectable, NotFoundException, BadRequestException, ConflictException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { DeliveryStatus, SubOrderStatus, UserRole, UserStatus } from '@obraja/types';
import {
  AssignDeliveryDto,
  RegisterDriverDto,
  UpdateDeliveryStatusDto,
  UpdateLocationDto,
  UpdateDriverOnlineDto,
} from './dto/delivery.dto';

const VALID_TRANSITIONS: Partial<Record<DeliveryStatus, DeliveryStatus[]>> = {
  [DeliveryStatus.ASSIGNED]: [DeliveryStatus.COLLECTING, DeliveryStatus.FAILED, DeliveryStatus.CANCELLED],
  [DeliveryStatus.COLLECTING]: [DeliveryStatus.IN_TRANSIT, DeliveryStatus.FAILED, DeliveryStatus.CANCELLED],
  [DeliveryStatus.IN_TRANSIT]: [DeliveryStatus.DELIVERED, DeliveryStatus.FAILED, DeliveryStatus.CANCELLED],
};

@Injectable()
export class DeliveryService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Private helpers ──────────────────────────────────────────────────────────

  private async findDriverByUserId(userId: string) {
    const driver = await this.prisma.driverProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!driver) throw new NotFoundException('Perfil de motorista não encontrado');
    return driver;
  }

  private async findDeliveryForDriver(deliveryId: string, driverId: string) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
      select: { id: true, driverId: true, status: true, subOrderId: true },
    });
    if (!delivery) throw new NotFoundException('Entrega não encontrada');
    if (delivery.driverId !== driverId) {
      throw new BadRequestException('Esta entrega não pertence a você');
    }
    return delivery;
  }

  // ── Public methods ───────────────────────────────────────────────────────────

  async register(dto: RegisterDriverDto) {
    const cpf = dto.cpf.replace(/\D/g, '');
    if (cpf.length !== 11) throw new BadRequestException('CPF inválido');

    const plate = dto.vehiclePlate.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

    const [emailExists, cpfExists, plateExists] = await Promise.all([
      this.prisma.user.findUnique({ where: { email: dto.email } }),
      this.prisma.driverProfile.findUnique({ where: { cpf } }),
      this.prisma.driverProfile.findUnique({ where: { vehiclePlate: plate } }),
    ]);

    if (emailExists) throw new ConflictException('E-mail já cadastrado');
    if (cpfExists) throw new ConflictException('CPF já cadastrado');
    if (plateExists) throw new ConflictException('Placa já cadastrada');

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
            firstName: dto.firstName,
            lastName: dto.lastName,
            cpf,
            vehicleType: dto.vehicleType,
            vehiclePlate: plate,
            vehicleBrand: dto.vehicleBrand,
            vehicleModel: dto.vehicleModel,
            vehicleYear: dto.vehicleYear ?? new Date().getFullYear(),
            vehicleColor: dto.vehicleColor ?? '',
          },
        },
      },
      select: { id: true, email: true, role: true, status: true },
    });

    return {
      message: 'Cadastro realizado! Aguardando análise da equipe ObraJá (até 48h úteis).',
      userId: user.id,
      status: UserStatus.PENDING_REVIEW,
    };
  }

  async assignDelivery(dto: AssignDeliveryDto) {
    const subOrder = await this.prisma.subOrder.findUnique({
      where: { id: dto.subOrderId },
      select: { id: true },
    });
    if (!subOrder) throw new NotFoundException('Sub-pedido não encontrado');

    const existing = await this.prisma.delivery.findUnique({
      where: { subOrderId: dto.subOrderId },
    });
    if (existing) throw new BadRequestException('Entrega já criada para este sub-pedido');

    const trackingCode = `OBJ${Date.now().toString(36).toUpperCase()}`;

    const delivery = await this.prisma.delivery.create({
      data: {
        subOrderId: dto.subOrderId,
        status: DeliveryStatus.ASSIGNED,
        trackingCode,
        driverId: dto.driverId ?? null,
      },
    });

    return delivery;
  }

  async acceptDelivery(deliveryId: string, userId: string) {
    const driver = await this.findDriverByUserId(userId);

    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
      select: { id: true, driverId: true, status: true },
    });
    if (!delivery) throw new NotFoundException('Entrega não encontrada');
    if (delivery.driverId !== null && delivery.driverId !== driver.id) {
      throw new BadRequestException('Esta entrega já está atribuída a outro motorista');
    }
    if (delivery.status !== DeliveryStatus.ASSIGNED) {
      throw new BadRequestException('Entrega não está disponível para aceite');
    }

    return this.prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        driverId: driver.id,
        status: DeliveryStatus.COLLECTING,
      },
    });
  }

  async updateStatus(deliveryId: string, userId: string, dto: UpdateDeliveryStatusDto) {
    const driver = await this.findDriverByUserId(userId);
    const delivery = await this.findDeliveryForDriver(deliveryId, driver.id);

    const allowed = VALID_TRANSITIONS[delivery.status as DeliveryStatus] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Transição inválida: ${delivery.status} → ${dto.status}`,
      );
    }

    const updateData: {
      status: DeliveryStatus;
      deliveredAt?: Date;
      proofUrl?: string;
      failedReason?: string;
    } = { status: dto.status };

    if (dto.status === DeliveryStatus.DELIVERED) {
      updateData.deliveredAt = new Date();
      if (dto.proofUrl) updateData.proofUrl = dto.proofUrl;

      await this.prisma.subOrder.update({
        where: { id: delivery.subOrderId },
        data: { status: SubOrderStatus.DELIVERED },
      });
    }

    if (dto.status === DeliveryStatus.FAILED) {
      if (!dto.failedReason) {
        throw new BadRequestException('Motivo da falha é obrigatório');
      }
      updateData.failedReason = dto.failedReason;

      await this.prisma.subOrder.update({
        where: { id: delivery.subOrderId },
        data: { status: SubOrderStatus.DELIVERY_FAILED },
      });
    }

    return this.prisma.delivery.update({
      where: { id: deliveryId },
      data: updateData,
    });
  }

  async updateLocation(deliveryId: string, userId: string, dto: UpdateLocationDto) {
    const driver = await this.findDriverByUserId(userId);
    await this.findDeliveryForDriver(deliveryId, driver.id);

    const recordedAt = new Date();

    await this.prisma.$transaction([
      this.prisma.delivery.update({
        where: { id: deliveryId },
        data: { currentLat: dto.lat, currentLng: dto.lng },
      }),
      this.prisma.deliveryTracking.create({
        data: { deliveryId, lat: dto.lat, lng: dto.lng, recordedAt },
      }),
    ]);

    return { lat: dto.lat, lng: dto.lng, recordedAt };
  }

  async getDeliveryBySubOrder(subOrderId: string) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { subOrderId },
      include: {
        tracking: {
          orderBy: { recordedAt: 'desc' },
          take: 20,
        },
      },
    });
    if (!delivery) throw new NotFoundException('Entrega não encontrada');
    return delivery;
  }

  async getMyDeliveries(userId: string, status?: string) {
    const driver = await this.findDriverByUserId(userId);

    const where: { driverId: string; status?: DeliveryStatus } = { driverId: driver.id };
    if (status) {
      const asStatus = status as DeliveryStatus;
      if (!Object.values(DeliveryStatus).includes(asStatus)) {
        throw new BadRequestException('Status inválido');
      }
      where.status = asStatus;
    }

    return this.prisma.delivery.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        subOrder: {
          select: {
            supplierId: true,
            _count: { select: { items: true } },
          },
        },
        tracking: {
          orderBy: { recordedAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  async setDriverOnline(userId: string, dto: UpdateDriverOnlineDto) {
    const driver = await this.prisma.driverProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!driver) throw new NotFoundException('Perfil de motorista não encontrado');

    return this.prisma.driverProfile.update({
      where: { id: driver.id },
      data: { isOnline: dto.isOnline },
      select: { id: true, isOnline: true },
    });
  }

  async getAvailableDeliveries() {
    return this.prisma.delivery.findMany({
      where: {
        status: DeliveryStatus.ASSIGNED,
        driverId: null,
      },
      orderBy: { createdAt: 'asc' },
      include: {
        subOrder: {
          select: {
            supplierId: true,
            _count: { select: { items: true } },
            order: {
              select: { deliveryAddress: true },
            },
          },
        },
      },
    });
  }
}
