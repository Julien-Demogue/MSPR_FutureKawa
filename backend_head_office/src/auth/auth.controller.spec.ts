import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SettingsService } from '../settings/settings.service';
import { AppRole } from '../utils/constants/roles.constant';

jest.mock('uuid', () => ({
  v4: jest.fn(() => '550e8400-e29b-41d4-a716-446655440000'),
}));

describe('AuthController', () => {
  let controller: AuthController;
  const authServiceMock = {
    registerRegular: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    refreshTokens: jest.fn(),
  };
  const settingsServiceMock = {
    DEFAULT_COOKIE_OPTIONS: {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: SettingsService, useValue: settingsServiceMock },
        { provide: ConfigService, useValue: {} },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('registers a user', async () => {
    await controller.registerRegular({
      email: 'john.doe@example.com',
      password: 'secret123',
    });

    expect(authServiceMock.registerRegular).toHaveBeenCalledWith({
      email: 'john.doe@example.com',
      password: 'secret123',
    });
  });

  it('logs in and sets auth cookie', async () => {
    const tokens = { access_token: 'access', refresh_token: 'refresh' };
    authServiceMock.login.mockResolvedValue({
      user: { uuid: 'user-uuid', role: { label: AppRole.ADMIN } },
      tokens,
    });

    const res = { cookie: jest.fn() } as any;

    const response = await controller.login(
      { email: 'JOHN.DOE@example.com', password: 'secret123' },
      res,
    );

    expect(authServiceMock.login).toHaveBeenCalledWith('john.doe@example.com', 'secret123');
    expect(res.cookie).toHaveBeenCalledWith('auth-cookie', tokens, settingsServiceMock.DEFAULT_COOKIE_OPTIONS);
    expect(response).toEqual(
      expect.objectContaining({
        sub: 'user-uuid',
        role: AppRole.ADMIN,
        access_token: 'access',
        refresh_token: 'refresh',
      }),
    );
  });

  it('logs out and clears auth cookie', async () => {
    const res = { clearCookie: jest.fn() } as any;

    await controller.logout(
      { user: { sub: 'user-uuid' } } as any,
      res,
    );

    expect(authServiceMock.logout).toHaveBeenCalledWith('user-uuid');
    expect(res.clearCookie).toHaveBeenCalledWith('auth-cookie', {
      httpOnly: settingsServiceMock.DEFAULT_COOKIE_OPTIONS.httpOnly,
      sameSite: settingsServiceMock.DEFAULT_COOKIE_OPTIONS.sameSite,
      secure: settingsServiceMock.DEFAULT_COOKIE_OPTIONS.secure,
      path: settingsServiceMock.DEFAULT_COOKIE_OPTIONS.path,
    });
  });

  it('refreshes tokens and sets auth cookie', async () => {
    const tokens = { access_token: 'new-access', refresh_token: 'new-refresh' };
    authServiceMock.refreshTokens.mockResolvedValue(tokens);

    const res = { cookie: jest.fn() } as any;
    const response = await controller.refresh(
      { cookies: { 'auth-cookie': { refresh_token: 'refresh' } } } as any,
      res,
    );

    expect(authServiceMock.refreshTokens).toHaveBeenCalledWith('refresh');
    expect(res.cookie).toHaveBeenCalledWith('auth-cookie', tokens, settingsServiceMock.DEFAULT_COOKIE_OPTIONS);
    expect(response).toEqual({ message: 'Tokens refreshed successfully' });
  });

  it('rejects refresh without token', async () => {
    await expect(controller.refresh({} as any, {} as any)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
