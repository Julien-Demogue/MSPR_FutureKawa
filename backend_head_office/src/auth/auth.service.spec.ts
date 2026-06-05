import { BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { compare } from 'bcrypt';
import { AuthService } from './auth.service';
import { SettingsService } from '../settings/settings.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import { AppRole } from '../utils/constants/roles.constant';

jest.mock('uuid', () => ({
  v4: jest.fn(() => '550e8400-e29b-41d4-a716-446655440000'),
}));

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  const usersServiceMock = {
    create: jest.fn(),
    findOneByEmail: jest.fn(),
    findOneByUuid: jest.fn(),
  };
  const jwtServiceMock = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };
  const userRepoMock = {
    findOne: jest.fn(),
  };
  const settingsServiceMock = {
    JWT_SECRET: 'secret',
    ACCESS_TOKEN_EXPIRY: '15m',
    REFRESH_TOKEN_EXPIRY: '7d',
    VERIFY_EMAIL_TOKEN_EXPIRY: '1d',
    RESET_PASS_TOKEN_EXPIRY: '1d',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersServiceMock },
        { provide: JwtService, useValue: jwtServiceMock },
        { provide: SettingsService, useValue: settingsServiceMock },
        { provide: getRepositoryToken(User), useValue: userRepoMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('registers a regular user', async () => {
    userRepoMock.findOne.mockResolvedValue(null);

    await service.registerRegular({
      email: 'john.doe@example.com',
      password: 'secret123',
    });

    expect(usersServiceMock.create).toHaveBeenCalledWith({
      email: 'john.doe@example.com',
      password: 'secret123',
      role_label: AppRole.USER,
    });
  });

  it('rejects missing credentials on register', async () => {
    await expect(service.registerRegular({ email: '', password: '' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects invalid email on register', async () => {
    await expect(service.registerRegular({ email: 'bad-email', password: 'secret' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects duplicate email on register', async () => {
    userRepoMock.findOne.mockResolvedValue({ uuid: 'existing' });

    await expect(
      service.registerRegular({ email: 'john.doe@example.com', password: 'secret123' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('validates user credentials', async () => {
    const user = { password: 'hashed' } as any;
    usersServiceMock.findOneByEmail.mockResolvedValue(user);
    (compare as jest.Mock).mockResolvedValue(true);

    const result = await service.validateUser('john.doe@example.com', 'secret123');

    expect(result).toBe(user);
  });

  it('rejects unknown user on validate', async () => {
    usersServiceMock.findOneByEmail.mockResolvedValue(null);

    await expect(service.validateUser('john.doe@example.com', 'secret123')).rejects.toThrow(
      'EmailNoUserError',
    );
  });

  it('rejects invalid password on validate', async () => {
    const user = { password: 'hashed' } as any;
    usersServiceMock.findOneByEmail.mockResolvedValue(user);
    (compare as jest.Mock).mockResolvedValue(false);

    await expect(service.validateUser('john.doe@example.com', 'secret123')).rejects.toThrow(
      'InvalidPwError',
    );
  });

  it('performs login and updates user', async () => {
    const tokens = { access_token: 'access', refresh_token: 'refresh' };
    const user = {
      uuid: 'user-uuid',
      role: { label: AppRole.ADMIN },
      save: jest.fn(),
    } as any;

    jest.spyOn(service, 'getTokens').mockResolvedValue(tokens);

    const result = await service.performLogin(user);

    expect(result).toEqual(tokens);
    expect(user.refresh_token).toBe('refresh');
    expect(user.save).toHaveBeenCalled();
    expect(user.last_login).toBeInstanceOf(Date);
  });

  it('refreshes tokens for valid refresh token', async () => {
    const tokens = { access_token: 'access', refresh_token: 'refresh' };
    const user = {
      uuid: 'user-uuid',
      role: { label: AppRole.ADMIN },
      refresh_token: 'refresh',
    } as any;

    jwtServiceMock.verifyAsync.mockResolvedValue({ sub: 'user-uuid' });
    usersServiceMock.findOneByUuid.mockResolvedValue(user);
    jest.spyOn(service, 'getTokens').mockResolvedValue(tokens);

    const result = await service.refreshTokens('refresh');

    expect(result).toEqual(tokens);
  });

  it('rejects refresh when token mismatches', async () => {
    jwtServiceMock.verifyAsync.mockResolvedValue({ sub: 'user-uuid' });
    usersServiceMock.findOneByUuid.mockResolvedValue({ refresh_token: 'other' });

    await expect(service.refreshTokens('refresh')).rejects.toThrow('InvalidRefreshTokenError');
  });

  it('login uses validateUser and performLogin', async () => {
    const user = { uuid: 'user-uuid' } as any;
    jest.spyOn(service, 'validateUser').mockResolvedValue(user);
    jest.spyOn(service, 'performLogin').mockResolvedValue({
      access_token: 'access',
      refresh_token: 'refresh',
    });

    const result = await service.login('john.doe@example.com', 'secret123');

    expect(service.validateUser).toHaveBeenCalledWith('john.doe@example.com', 'secret123');
    expect(service.performLogin).toHaveBeenCalledWith(user);
    expect(result).toEqual({
      user,
      tokens: { access_token: 'access', refresh_token: 'refresh' },
    });
  });
});
