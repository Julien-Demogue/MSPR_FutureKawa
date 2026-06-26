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
import { RolesService } from '../roles/roles.service';
import { AuthGuard } from '@nestjs/passport';

describe('Auth Integration Test', () => {
  let app: INestApplication;
  let roleRepository: Repository<Role>;
  let createdUserUuid: string;

  const testUserEmail = 'auth-tester@kawa.com';

  beforeAll(async () => {
    // Override the JWT Guard and inject a mocked JWT Payload
    const allowGuard = {
      canActivate: jest.fn((context) => {
        const req = context.switchToHttp().getRequest();
        req.user = {
          sub: createdUserUuid || '550e8400-e29b-41d4-a716-446655440000',
          role_label: 'USER',
        };
        return true;
      }),
    };

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
        RolesService,
        ConfigService,
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
      ],
    })
      // Override Passport's specific AuthGuard('jwt')
      .overrideGuard(AuthGuard('jwt'))
      .useValue(allowGuard)
      .compile();

    roleRepository = module.get<Repository<Role>>(getRepositoryToken(Role));

    // Seed default role required by UsersService for regular registration
    await roleRepository.insert({
      id: 1,
      uuid: '330e8400-e29b-41d4-a716-446655440000',
      label: 'USER',
    });

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
      });

    if (response.status !== 201) {
      console.error('POST /auth/register failed:', response.body);
    }

    // NestJS default POST response is 201. AuthController.registerRegular returns Promise<void>
    expect(response.status).toBe(201);
  });

  it('POST /auth/login should authenticate user and set cookie', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUserEmail,
        password: 'password123',
      });

    if (response.status !== 201 && response.status !== 200) {
      console.error('POST /auth/login failed:', response.body);
    }

    expect([200, 201]).toContain(response.status);
    expect(response.headers['set-cookie']).toBeDefined();

    // Store the UUID from the response to use in the mocked JWT payload for the logout test
    createdUserUuid = response.body.sub;
  });

  it('POST /auth/logout should clear authentication cookie', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/logout');

    if (response.status !== 201 && response.status !== 200) {
      console.error('POST /auth/logout failed:', response.body);
    }

    expect([200, 201]).toContain(response.status);
    expect(response.headers['set-cookie'][0]).toContain('auth-cookie=;');
  });
});