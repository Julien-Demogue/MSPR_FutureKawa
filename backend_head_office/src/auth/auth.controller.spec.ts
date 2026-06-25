import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import { Role } from '../roles/role.entity';
import { SettingsService } from '../settings/settings.service';
import { ConfigService } from '@nestjs/config';

describe('Auth Integration Test', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;

  const testUserEmail = 'auth-tester@kawa.com';

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [User, Role],
          synchronize: true,
          logging: false,
        }),
        TypeOrmModule.forFeature([User, Role]),
        JwtModule.register({ secret: 'test-secret' }),
      ],
      controllers: [AuthController],
      providers: [
        AuthService,
        UsersService,
        {
          provide: SettingsService,
          useValue: {
            JWT_SECRET: 'test-secret',
            ACCESS_TOKEN_EXPIRY: '15m',
            REFRESH_TOKEN_EXPIRY: '7d',
            DEFAULT_COOKIE_OPTIONS: {
              httpOnly: true,
              sameSite: 'lax',
              secure: false,
              path: '/',
            },
          },
        },
        ConfigService,
      ],
    }).compile();

    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/register should create a new user', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        first_name: 'Auth',
        last_name: 'Tester',
        email: testUserEmail,
        password: 'password123',
        role_label: 'USER',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('uuid');
  });

  it('POST /auth/login should authenticate user and set cookie', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUserEmail,
        password: 'password123',
      });

    expect(response.status).toBe(200);
    expect(response.headers['set-cookie']).toBeDefined();
  });

  it('POST /auth/logout should clear authentication cookie', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/logout');

    expect(response.status).toBe(200);
    expect(response.headers['set-cookie'][0]).toContain('auth-cookie=;');
  });
});