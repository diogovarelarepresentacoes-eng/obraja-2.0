import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { SKIP_APPROVAL_KEY } from '../decorators/skip-approval.decorator';
import { UserStatus, UserRole } from '@obraja/types';

@Injectable()
export class ApprovedGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_APPROVAL_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) return true;

    const { user } = context.switchToHttp().getRequest<{ user?: { status?: string; role?: string } }>();
    if (!user) return false;

    // Admins are always APPROVED — skip check
    if (user.role === UserRole.ADMIN) return true;

    if (user.status && user.status !== UserStatus.APPROVED) {
      throw new ForbiddenException('Sua conta ainda não foi aprovada pela equipe ObraJá');
    }

    return true;
  }
}
