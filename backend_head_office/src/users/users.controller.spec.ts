import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { Role } from '../roles/role.entity';
import { RolesService } from '../roles/roles.service';
import { LoginGuard } from '../utils/guards/login.guard';
import { RoleGuard } from '../utils/guards/role.guard';

describe('Users Integration Test', () => {
    let app: INestApplication;
    let roleRepository: Repository<Role>;
    let createdUserUuid: string;
    let createdUserId: number;

    const mockRoleUuid = '330e8400-e29b-41d4-a716-446655440000';
    const testUserEmail = 'coffeeman@brazil.com';

    const createUserDto = {
        first_name: 'John',
        last_name: 'Doe',
        email: testUserEmail,
        password: 'securePassword123',
        id_role: 1,
        role_label: 'ADMIN',
    };

    beforeAll(async () => {
        const allowGuard = {
            canActivate: jest.fn((context) => {
                const req = context.switchToHttp().getRequest();
                req.user = {
                    sub: createdUserUuid || '550e8400-e29b-41d4-a716-446655440000',
                    email: testUserEmail,
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
            ],
            controllers: [UsersController],
            providers: [
                UsersService,
                RolesService,
            ],
        })
            .overrideGuard(LoginGuard)
            .useValue(allowGuard)
            .overrideGuard(RoleGuard)
            .useValue(allowGuard)
            .compile();

        roleRepository = module.get<Repository<Role>>(getRepositoryToken(Role));

        await roleRepository.insert({
            id: 1,
            uuid: mockRoleUuid,
            label: 'ADMIN',
        });

        app = module.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    it('POST /users should save user in database', async () => {
        const response = await request(app.getHttpServer())
            .post('/users')
            .send(createUserDto);

        if (response.status !== 201) {
            console.error('POST /users failed payload check:', response.body);
        }

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('uuid');
        expect(response.body.email).toBe(testUserEmail);
        expect(response.body.password).not.toBe(createUserDto.password);

        createdUserUuid = response.body.uuid;
        createdUserId = response.body.id;
    });

    it('GET /users should retrieve all users', async () => {
        const response = await request(app.getHttpServer())
            .get('/users');

        if (response.status !== 200) {
            console.error('GET /users failed:', response.body);
        }

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBeTruthy();
        expect(response.body.length).toBe(1);
        expect(response.body[0].uuid).toBe(createdUserUuid);
    });

    it('GET /users/me should retrieve logged-in user profile', async () => {
        const response = await request(app.getHttpServer())
            .get('/users/me');

        if (response.status !== 200) {
            console.error('GET /users/me failed:', response.body);
        }

        expect(response.status).toBe(200);
        expect(response.body.uuid).toBe(createdUserUuid);
        expect(response.body.email).toBe(testUserEmail);
    });

    it('GET /users/uuid should retrieve user by UUID', async () => {
        const response = await request(app.getHttpServer())
            .get('/users/uuid')
            .query({ uuid: createdUserUuid });

        if (response.status !== 200) {
            console.error('GET /users/uuid failed:', response.body);
        }

        expect(response.status).toBe(200);
        expect(response.body.id).toBe(createdUserId);
    });

    it('GET /users/id should retrieve user by ID', async () => {
        const response = await request(app.getHttpServer())
            .get('/users/id')
            .query({ id: createdUserId });

        if (response.status !== 200) {
            console.error('GET /users/id failed:', response.body);
        }

        expect(response.status).toBe(200);
        expect(response.body.uuid).toBe(createdUserUuid);
    });

    it('GET /users/email should retrieve user by email', async () => {
        const response = await request(app.getHttpServer())
            .get('/users/email')
            .query({ email: testUserEmail });

        if (response.status !== 200) {
            console.error('GET /users/email failed:', response.body);
        }

        expect(response.status).toBe(200);
        expect(response.body.uuid).toBe(createdUserUuid);
    });

    it('PATCH /users should update database entry', async () => {
        const response = await request(app.getHttpServer())
            .patch('/users')
            .query({ uuid: createdUserUuid })
            .send({ first_name: 'Jane' });

        if (response.status !== 200) {
            console.error('PATCH /users failed:', response.body);
        }

        expect(response.status).toBe(200);
        expect(response.body.first_name).toBe('Jane');
    });

    it('DELETE /users should mark user as deleted (soft delete)', async () => {
        const response = await request(app.getHttpServer())
            .delete('/users')
            .query({ uuid: createdUserUuid });

        if (response.status !== 204) {
            console.error('DELETE /users failed:', response.body);
        }

        expect(response.status).toBe(204);
    });

    it('PATCH /users/restore should reactivate the user', async () => {
        const response = await request(app.getHttpServer())
            .patch('/users/restore')
            .query({ uuid: createdUserUuid });

        if (response.status !== 200) {
            console.error('PATCH /users/restore failed:', response.body);
        }

        expect(response.status).toBe(200);
        expect(response.body.deleted_at).toBeNull();
    });
});