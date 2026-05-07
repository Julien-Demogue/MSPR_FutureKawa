import { Body, Controller, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
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

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 409, description: 'Conflict' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async registerRegular(
    @Body() body: RegisterDto,
  ): Promise<void> {
    await this.authService.registerRegular(body);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login a user' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 201, description: 'User logged in successfully' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
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

  @UseGuards(AuthGuard("jwt"))
  @Post('logout')
  @ApiOperation({ summary: 'Logout a user' })
  @ApiResponse({ status: 201, description: 'User logged out successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
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
  @ApiOperation({ summary: 'Refresh authentication tokens' })
  @ApiResponse({ status: 201, description: 'Tokens refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
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