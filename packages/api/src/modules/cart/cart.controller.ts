import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Req, Headers,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { Request } from 'express';
import { CartService } from './cart.service';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Cart')
@Controller('cart')
export class CartController {
  constructor(private cartService: CartService) {}

  private extractContext(req: Request, sessionId?: string) {
    const user = req.user as { id: string } | undefined;
    return {
      userId: user?.id,
      sessionId: sessionId ?? undefined,
    };
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Obter carrinho (guest ou autenticado)' })
  @ApiHeader({ name: 'x-session-id', required: false, description: 'Session ID para carrinho de convidado' })
  getCart(
    @Req() req: Request,
    @Headers('x-session-id') sessionId?: string,
  ) {
    const { userId, sessionId: sid } = this.extractContext(req, sessionId);
    return this.cartService.getCart(userId, sid);
  }

  @Public()
  @Post('items')
  @ApiOperation({ summary: 'Adicionar item ao carrinho' })
  @ApiHeader({ name: 'x-session-id', required: false })
  addItem(
    @Req() req: Request,
    @Headers('x-session-id') sessionId: string | undefined,
    @Body() dto: AddToCartDto,
  ) {
    const { userId, sessionId: sid } = this.extractContext(req, sessionId);
    return this.cartService.addItem(userId, sid, dto);
  }

  @Public()
  @Patch('items/:productId')
  @ApiOperation({ summary: 'Atualizar quantidade de item (quantity=0 remove)' })
  @ApiHeader({ name: 'x-session-id', required: false })
  updateItem(
    @Req() req: Request,
    @Headers('x-session-id') sessionId: string | undefined,
    @Param('productId') productId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    const { userId, sessionId: sid } = this.extractContext(req, sessionId);
    return this.cartService.updateItem(userId, sid, productId, dto);
  }

  @Public()
  @Delete()
  @ApiOperation({ summary: 'Limpar carrinho' })
  @ApiHeader({ name: 'x-session-id', required: false })
  clearCart(
    @Req() req: Request,
    @Headers('x-session-id') sessionId: string | undefined,
  ) {
    const { userId, sessionId: sid } = this.extractContext(req, sessionId);
    return this.cartService.clearCart(userId, sid);
  }

  @Post('merge')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mesclar carrinho guest ao carrinho do usuário autenticado' })
  @ApiHeader({ name: 'x-session-id', required: true, description: 'Session ID do carrinho guest a mesclar' })
  mergeGuestCart(
    @Req() req: Request,
    @Headers('x-session-id') sessionId: string,
  ) {
    const user = req.user as { id: string };
    return this.cartService.mergeGuestCart(user.id, sessionId);
  }
}
