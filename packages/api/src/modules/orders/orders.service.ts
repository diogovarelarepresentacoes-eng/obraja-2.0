import {
  Injectable, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateSubOrderStatusDto } from './dto/update-order.dto';
import { UserRole, SubOrderStatus } from '@obraja/types';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async createFromCart(userId: string, userRole: UserRole, dto: CreateOrderDto) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true, name: true, sku: true, price: true,
                b2bPrice: true, moq: true, stock: true, unit: true,
                supplierId: true, status: true,
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Carrinho está vazio');
    }

    for (const item of cart.items) {
      if (item.product.status !== 'ACTIVE') {
        throw new BadRequestException(
          `Produto "${item.product.name}" não está disponível`,
        );
      }
      if (item.product.stock < item.quantity) {
        throw new BadRequestException(
          `Estoque insuficiente para o produto "${item.product.name}". Disponível: ${item.product.stock}`,
        );
      }
      if (item.quantity < item.product.moq) {
        throw new BadRequestException(
          `Quantidade mínima para "${item.product.name}" é ${item.product.moq} ${item.product.unit}.`,
        );
      }
    }

    const isContractor = userRole === UserRole.CONTRACTOR;

    const groupedBySupplier = new Map<string, typeof cart.items>();
    for (const item of cart.items) {
      const supplierId = item.product.supplierId;
      if (!groupedBySupplier.has(supplierId)) {
        groupedBySupplier.set(supplierId, []);
      }
      groupedBySupplier.get(supplierId)!.push(item);
    }

    const supplierIds = Array.from(groupedBySupplier.keys());
    const supplierProfiles = await this.prisma.supplierProfile.findMany({
      where: { id: { in: supplierIds } },
      select: { id: true, commissionRate: true },
    });
    const commissionMap = new Map(supplierProfiles.map((s) => [s.id, s.commissionRate]));

    let totalAmount = 0;
    for (const item of cart.items) {
      const unitPrice =
        isContractor && item.product.b2bPrice != null
          ? item.product.b2bPrice
          : item.product.price;
      totalAmount += unitPrice * item.quantity;
    }

    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId,
          paymentMethod: dto.paymentMethod,
          deliveryAddress: dto.deliveryAddress as object,
          totalAmount,
          notes: dto.notes,
          status: 'PENDING_PAYMENT',
        },
      });

      for (const [supplierId, items] of groupedBySupplier) {
        let subtotal = 0;
        const itemData: {
          productId: string;
          productName: string;
          productSku: string | null;
          quantity: number;
          unitPrice: number;
          totalPrice: number;
        }[] = [];

        for (const item of items) {
          const unitPrice =
            isContractor && item.product.b2bPrice != null
              ? item.product.b2bPrice
              : item.product.price;
          const totalPrice = unitPrice * item.quantity;
          subtotal += totalPrice;
          itemData.push({
            productId: item.product.id,
            productName: item.product.name,
            productSku: item.product.sku ?? null,
            quantity: item.quantity,
            unitPrice,
            totalPrice,
          });
        }

        const commissionRate = commissionMap.get(supplierId) ?? 0.1;
        const commissionValue = subtotal * commissionRate;

        const subOrder = await tx.subOrder.create({
          data: {
            orderId: newOrder.id,
            supplierId,
            subtotal,
            commissionRate,
            commissionValue,
            status: 'AWAITING_SEPARATION',
          },
        });

        await tx.subOrderItem.createMany({
          data: itemData.map((d) => ({ subOrderId: subOrder.id, ...d })),
        });

        for (const item of items) {
          await tx.product.update({
            where: { id: item.product.id },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return tx.order.findUnique({
        where: { id: newOrder.id },
        include: {
          subOrders: {
            include: {
              items: true,
              supplier: { select: { companyName: true, tradeName: true } },
            },
          },
        },
      });
    });

    return order;
  }

  async findMyOrders(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const where = { userId };

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          subOrders: {
            select: {
              id: true,
              status: true,
              subtotal: true,
              supplier: { select: { companyName: true, tradeName: true } },
              _count: { select: { items: true } },
            },
          },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { data: orders, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        subOrders: {
          include: {
            items: true,
            supplier: { select: { companyName: true, tradeName: true } },
            delivery: true,
          },
        },
      },
    });

    if (!order) throw new NotFoundException('Pedido não encontrado');
    if (order.userId !== userId) throw new NotFoundException('Pedido não encontrado');

    return order;
  }

  async findSupplierOrdersByUserId(userId: string, status?: string, page = 1, limit = 20) {
    const profile = await this.prisma.supplierProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) throw new BadRequestException('Perfil de fornecedor não encontrado');
    return this.findSupplierOrders(profile.id, status, page, limit);
  }

  async findSupplierOrders(
    supplierId: string,
    status?: string,
    page = 1,
    limit = 20,
  ) {
    const skip = (page - 1) * limit;
    const where = {
      supplierId,
      ...(status && { status: status as SubOrderStatus }),
    };

    const [subOrders, total] = await Promise.all([
      this.prisma.subOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
          order: {
            select: {
              id: true,
              deliveryAddress: true,
              status: true,
              createdAt: true,
              user: { select: { email: true, phone: true } },
            },
          },
        },
      }),
      this.prisma.subOrder.count({ where }),
    ]);

    return { data: subOrders, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateSubOrderStatusByUserId(
    subOrderId: string,
    userId: string,
    dto: UpdateSubOrderStatusDto,
  ) {
    const profile = await this.prisma.supplierProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!profile) throw new BadRequestException('Perfil de fornecedor não encontrado');
    return this.updateSubOrderStatus(subOrderId, profile.id, dto);
  }

  async updateSubOrderStatus(
    subOrderId: string,
    supplierId: string,
    dto: UpdateSubOrderStatusDto,
  ) {
    const subOrder = await this.prisma.subOrder.findUnique({
      where: { id: subOrderId },
      select: { id: true, supplierId: true, orderId: true },
    });

    if (!subOrder || subOrder.supplierId !== supplierId) {
      throw new NotFoundException('Sub-pedido não encontrado');
    }

    await this.prisma.subOrder.update({
      where: { id: subOrderId },
      data: { status: dto.status },
    });

    if (dto.status === SubOrderStatus.DELIVERED) {
      const siblings = await this.prisma.subOrder.findMany({
        where: { orderId: subOrder.orderId },
        select: { id: true, status: true },
      });

      const allDelivered = siblings.every(
        (s) => s.id === subOrderId || s.status === SubOrderStatus.DELIVERED,
      );

      if (allDelivered) {
        await this.prisma.order.update({
          where: { id: subOrder.orderId },
          data: { status: 'PAYMENT_CONFIRMED' },
        });
      }
    }

    return this.prisma.subOrder.findUnique({
      where: { id: subOrderId },
      include: { items: true },
    });
  }

  async findAllOrders(page: number, limit: number, status?: string) {
    const skip = (page - 1) * limit;
    const where = status ? { status: status as 'PENDING_PAYMENT' | 'PAYMENT_CONFIRMED' | 'PAYMENT_FAILED' | 'CANCELLED' } : {};

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true } },
          subOrders: {
            select: {
              id: true, status: true, subtotal: true,
              supplier: { select: { companyName: true } },
            },
          },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { data: orders, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
