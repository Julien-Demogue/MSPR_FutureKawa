import { Body, Controller, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ConfigService } from "@nestjs/config";
import { AuthService } from './auth.service';
import type {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from "express";
import { AuthGuard } from '@nestjs/passport';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { SettingsService } from '../settings/settings.service';
import { Public } from '../utils/decorators/public.decorator';
import { User } from '../users/user.entity';
import { JwtPayload } from '../utils/dto/jwt.dto';
import { extractRefreshFromCookie } from '../utils/strategies/utils.strategy';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly authService: AuthService,
    private readonly config: ConfigService
  ) { }

  @ApiOkResponse({ type: String })
  @Public()
  @Post('register')
  async registerRegular(
    @Body() body: RegisterDto,
  ): Promise<void> {
    await this.authService.registerRegular(body);
  }

  @ApiOkResponse({ type: User })
  @Public()
  @Post('login')
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: ExpressResponse,
  ): Promise<User> {
    const { user, tokens } = await this.authService.login(
      body.email.toLowerCase(),
      body.password,
    );

    res.cookie("auth-cookie", tokens, this.settingsService.DEFAULT_COOKIE_OPTIONS);


    const userForToken = {
      sub: user.uuid,
      role: user.role.label,
    }

    // Ajouter les tokens dans la réponse pour les endpoints utilisant Bearer Token
    const response = {
      ...userForToken,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    } as any;

    return response;
  }

  @ApiOkResponse({ type: String })
  @UseGuards(AuthGuard("jwt"))
  @Post('logout')
  async logout(
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: ExpressResponse,
  ): Promise<{ msg: string }> {
    try {
      const { sub } = (req as ExpressRequest & { user: JwtPayload }).user;

      await this.authService.logout(sub);

      res.clearCookie("auth-cookie", {
        httpOnly: this.settingsService.DEFAULT_COOKIE_OPTIONS.httpOnly,
        sameSite: this.settingsService.DEFAULT_COOKIE_OPTIONS.sameSite,
        secure: this.settingsService.DEFAULT_COOKIE_OPTIONS.secure,
        path: this.settingsService.DEFAULT_COOKIE_OPTIONS.path
      });

      return { msg: "Logged out successfully" };
    } catch (error) {
      throw new Error("Logout Error");
    }
  }


  @Public()
  @Post('refresh')
  async refresh(
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: ExpressResponse,
  ): Promise<{ message: string }> {
    // Extraire le refresh_token du cookie
    const refreshToken = extractRefreshFromCookie(req);

    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    try {
      const newTokens = await this.authService.refreshTokens(refreshToken);

      res.cookie("auth-cookie", newTokens, this.settingsService.DEFAULT_COOKIE_OPTIONS);

      return { message: 'Tokens refreshed successfully' };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}