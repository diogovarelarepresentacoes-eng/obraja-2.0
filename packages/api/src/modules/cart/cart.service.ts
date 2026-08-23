import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';

const CART_ITEM_INCLUDE = {
  items: {
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          b2bPrice: true,
          moq: true,
          stock: true,
          unit: true,
          status: true,
          images: { where: { isPrimary: true }, take: 1 },
          supplier: { select: { companyName: true, tradeName: true } },
        },
      },
    },
  },
} as const;

interface CartProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  b2bPrice: number | null;
  moq: number;
  stock: number;
  unit: string;
  status: string;
  images: Array<{ isPrimary: boolean; url: string; alt: string | null; id: string; productId: string; sortOrder: number }>;
  supplier: { companyName: string; tradeName: string | null };
}

interface CartItemWithProduct {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  addedAt: Date;
  product: CartProduct;
}

interface CartBase {
  id: string;
  userId: string | null;
  sessionId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface CartWithItems extends CartBase {
  items: CartItemWithProduct[];
}

function computeTotals(cart: CartWithItems) {
  const subtotal = cart.items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );
  return { ...cart, subtotal };
}

function buildWhere(userId?: string, sessionId?: string) {
  if (userId) return { userId };
  if (sessionId) return { sessionId };
  throw new BadRequestException('userId ou sessionId é obrigatório');
}

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async findOrCreateCart(userId?: string, sessionId?: string) {
    const where = buildWhere(userId, sessionId);
    const existing = await this.prisma.cart.findFirst({ where });
    if (existing) return existing;
    return this.prisma.cart.create({ data: where });
  }

  private async getCartWithItems(userId?: string, sessionId?: string) {
    const where = buildWhere(userId, sessionId);
    const cart = await this.prisma.cart.findFirst({
      where,
      include: CART_ITEM_INCLUDE,
    });

    if (!cart) {
      const created = await this.prisma.cart.create({
        data: where,
        include: CART_ITEM_INCLUDE,
      });
      return computeTotals(created as unknown as CartWithItems);
    }

    return computeTotals(cart as unknown as CartWithItems);
  }

  async getCart(userId?: string, sessionId?: string) {
    return this.getCartWithItems(userId, sessionId);
  }

  async addItem(
    userId: string | undefined,
    sessionId: string | undefined,
    dto: AddToCartDto,
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId, deletedAt: null },
    });

    if (!product) throw new NotFoundException('Produto não encontrado');
    if (product.status !== 'ACTIVE') {
      throw new BadRequestException('Produto não está disponível');
    }
    if (dto.quantity < product.moq) {
      throw new BadRequestException(
        `Quantidade mínima para "${product.name}" é ${product.moq} ${product.unit}.`,
      );
    }

    const cart = await this.findOrCreateCart(userId, sessionId);

    const existing = await this.prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId: dto.productId } },
    });

    if (existing) {
      await this.prisma.cartItem.update({
        where: { cartId_productId: { cartId: cart.id, productId: dto.productId } },
        data: { quantity: existing.quantity + dto.quantity },
      });
    } else {
      await this.prisma.cartItem.create({
        data: { cartId: cart.id, productId: dto.productId, quantity: dto.quantity },
      });
    }

    return this.getCartWithItems(userId, sessionId);
  }

  async updateItem(
    userId: string | undefined,
    sessionId: string | undefined,
    productId: string,
    dto: UpdateCartItemDto,
  ) {
    const cart = await this.findOrCreateCart(userId, sessionId);

    if (dto.quantity === 0) {
      await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
    } else {
      const existing = await this.prisma.cartItem.findUnique({
        where: { cartId_productId: { cartId: cart.id, productId } },
        include: {
          product: { select: { moq: true, name: true, unit: true } },
        },
      });

      if (!existing) throw new NotFoundException('Item não encontrado no carrinho');

      if (dto.quantity < existing.product.moq) {
        throw new BadRequestException(
          `Quantidade mínima para "${existing.product.name}" é ${existing.product.moq} ${existing.product.unit}.`,
        );
      }

      await this.prisma.cartItem.update({
        where: { cartId_productId: { cartId: cart.id, productId } },
        data: { quantity: dto.quantity },
      });
    }

    return this.getCartWithItems(userId, sessionId);
  }

  async clearCart(userId: string | undefined, sessionId: string | undefined) {
    const cart = await this.findOrCreateCart(userId, sessionId);
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return this.getCartWithItems(userId, sessionId);
  }

  async mergeGuestCart(userId: string, sessionId: string) {
    const guestCart = await this.prisma.cart.findUnique({ where: { sessionId } });
    if (!guestCart) return this.getCartWithItems(userId, undefined);

    const userCart = await this.findOrCreateCart(userId, undefined);

    const guestItems = await this.prisma.cartItem.findMany({
      where: { cartId: guestCart.id },
    });

    await this.prisma.$transaction(async (tx) => {
      for (const item of guestItems) {
        const existing = await tx.cartItem.findUnique({
          where: { cartId_productId: { cartId: userCart.id, productId: item.productId } },
        });

        if (existing) {
          await tx.cartItem.update({
            where: { cartId_productId: { cartId: userCart.id, productId: item.productId } },
            data: { quantity: existing.quantity + item.quantity },
          });
        } else {
          await tx.cartItem.create({
            data: { cartId: userCart.id, productId: item.productId, quantity: item.quantity },
          });
        }
      }

      await tx.cartItem.deleteMany({ where: { cartId: guestCart.id } });
      await tx.cart.delete({ where: { id: guestCart.id } });
    });

    return this.getCartWithItems(userId, undefined);
  }
}
