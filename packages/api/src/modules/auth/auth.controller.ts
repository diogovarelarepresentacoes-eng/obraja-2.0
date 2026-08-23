import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Public } from '../../common/decorators/public.decorator';
import { JwtPayload } from '@obraja/types';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Criar nova conta' })
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register(dto);

    if ('refreshToken' in result) {
      res.cookie('refresh_token', result.refreshToken, REFRESH_COOKIE_OPTIONS);
      return { accessToken: result.accessToken };
    }

    return result;
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fazer login' })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken } = await this.authService.login(dto);
    res.cookie('refresh_token', refreshToken, REFRESH_COOKIE_OPTIONS);
    return { accessToken };
  }

  @Public()
  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar access token via cookie' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const user = req.user as JwtPayload;
    const { accessToken, refreshToken } = await this.authService.refresh(
      user.sub,
      user.email,
      user.role ?? '',
    );
    res.cookie('refresh_token', refreshToken, REFRESH_COOKIE_OPTIONS);
    return { accessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fazer logout' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const user = req.user as { id: string };
    res.clearCookie('refresh_token');
    return this.authService.logout(user.id);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Dados do usuário autenticado' })
  async me(@Req() req: Request) {
    const user = req.user as { id: string };
    return this.authService.me(user.id);
  }
}
