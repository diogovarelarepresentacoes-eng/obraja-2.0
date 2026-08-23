import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { JwtPayload } from '@obraja/types';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.['refresh_token'] as string | null,
      ]),
      secretOrKey: config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      ignoreExpiration: false,
      passReqToCallback: true,
    });
  }

  validate(_req: Request, payload: JwtPayload) {
    if (!payload.sub) throw new UnauthorizedException();
    return payload;
  }
}
