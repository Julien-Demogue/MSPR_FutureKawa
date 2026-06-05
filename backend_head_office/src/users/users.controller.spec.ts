import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import request from 'supertest';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { LoginGuard } from '../utils/guards/login.guard';
import { RoleGuard } from '../utils/guards/role.guard';

jest.mock('uuid', () => ({
    v4: jest.fn(() => '550e8400-e29b-41d4-a716-446655440000'),
}));

describe('UsersController', () => {
    let app: INestApplication;
    const validUuid = '550e8400-e29b-41d4-a716-446655440000';
    const usersServiceMock = {
        create: jest.fn(),
        findAll: jest.fn(),
        findOneByUuid: jest.fn(),
        findOneById: jest.fn(),
        findOneByEmail: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
        restore: jest.fn(),
    };

    const createDto = {
        email: 'john.doe@example.com',
        password: 'secret123',
        role_label: 'Admin',
    };

    beforeAll(async () => {
        const allowGuard = {
            canActivate: jest.fn(() => true),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [UsersController],
            providers: [
                {
                    provide: UsersService,
                    useValue: usersServiceMock,
                },
            ],
        })
            .overrideGuard(LoginGuard)
            .useValue(allowGuard)
            .overrideGuard(RoleGuard)
            .useValue(allowGuard)
            .compile();

        app = module.createNestApplication();
        await app.init();
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterAll(async () => {
        await app.close();
    });

    it('POST /users should create a user', async () => {
        usersServiceMock.create.mockResolvedValue({ id: 1, uuid: validUuid, ...createDto });

        await request(app.getHttpServer()).post('/users').send(createDto).expect(201);
    });

    it('POST /users should propagate service internal errors', async () => {
        usersServiceMock.create.mockRejectedValue(new InternalServerErrorException('DB unavailable'));

        await request(app.getHttpServer()).post('/users').send(createDto).expect(500);
    });

    it('GET /users should return all users', async () => {
        usersServiceMock.findAll.mockResolvedValue([{ id: 1, uuid: validUuid, ...createDto }]);

        await request(app.getHttpServer()).get('/users').expect(200);
    });

    it('GET /users should propagate service internal errors', async () => {
        usersServiceMock.findAll.mockRejectedValue(new InternalServerErrorException('DB unavailable'));

        await request(app.getHttpServer()).get('/users').expect(500);
    });

    it('GET /users/uuid should return 400 for invalid uuid', async () => {
        await request(app.getHttpServer()).get('/users/uuid').query({ uuid: 'invalid' }).expect(400);
        expect(usersServiceMock.findOneByUuid).not.toHaveBeenCalled();
    });

    it('GET /users/uuid should return one user for valid uuid', async () => {
        usersServiceMock.findOneByUuid.mockResolvedValue({ id: 1, uuid: validUuid, ...createDto });

        await request(app.getHttpServer()).get('/users/uuid').query({ uuid: validUuid }).expect(200);
    });

    it('GET /users/uuid should propagate service not found errors for valid uuid', async () => {
        usersServiceMock.findOneByUuid.mockRejectedValue(new BadRequestException('User not found'));

        await request(app.getHttpServer()).get('/users/uuid').query({ uuid: validUuid }).expect(400);
    });

    it('GET /users/id should return 400 for invalid id', async () => {
        await request(app.getHttpServer()).get('/users/id').query({ id: 'x' }).expect(400);
        expect(usersServiceMock.findOneById).not.toHaveBeenCalled();
    });

    it('GET /users/id should return one user for valid id', async () => {
        usersServiceMock.findOneById.mockResolvedValue({ id: 1, uuid: validUuid, ...createDto });

        await request(app.getHttpServer()).get('/users/id').query({ id: 1 }).expect(200);
    });

    it('GET /users/email should return 400 for invalid email', async () => {
        usersServiceMock.findOneByEmail.mockRejectedValue(new BadRequestException('Invalid email'));

        await request(app.getHttpServer()).get('/users/email').query({ email: 'bad-email' }).expect(400);
    });

    it('GET /users/email should return one user for valid email', async () => {
        usersServiceMock.findOneByEmail.mockResolvedValue({ id: 1, uuid: validUuid, ...createDto });

        await request(app.getHttpServer()).get('/users/email').query({ email: createDto.email }).expect(200);
    });

    it('GET /users/email should propagate service not found errors for valid email', async () => {
        usersServiceMock.findOneByEmail.mockRejectedValue(new BadRequestException('User not found'));

        await request(app.getHttpServer()).get('/users/email').query({ email: createDto.email }).expect(400);
    });

    it('PATCH /users should return 400 for invalid uuid', async () => {
        await request(app.getHttpServer()).patch('/users').query({ uuid: 'invalid' }).send({ first_name: 'Jane' }).expect(400);
    });

    it('PATCH /users should update a user for valid uuid', async () => {
        usersServiceMock.update.mockResolvedValue({ id: 1, uuid: validUuid, ...createDto, first_name: 'Jane' });

        await request(app.getHttpServer())
            .patch('/users')
            .query({ uuid: validUuid })
            .send({ first_name: 'Jane' })
            .expect(200);
    });

    it('PATCH /users should propagate service internal errors', async () => {
        usersServiceMock.update.mockRejectedValue(new InternalServerErrorException('DB unavailable'));

        await request(app.getHttpServer()).patch('/users').query({ uuid: validUuid }).send({ first_name: 'Jane' }).expect(500);
    });

    it('DELETE /users should return 400 for invalid uuid', async () => {
        await request(app.getHttpServer()).delete('/users').query({ uuid: 'invalid' }).expect(400);
    });

    it('DELETE /users should delete a user for valid uuid', async () => {
        usersServiceMock.remove.mockResolvedValue(undefined);

        await request(app.getHttpServer()).delete('/users').query({ uuid: validUuid }).expect(204);
    });

    it('DELETE /users should propagate service internal errors', async () => {
        usersServiceMock.remove.mockRejectedValue(new InternalServerErrorException('DB unavailable'));

        await request(app.getHttpServer()).delete('/users').query({ uuid: validUuid }).expect(500);
    });

    it('PATCH /users/restore should return 400 for invalid uuid', async () => {
        await request(app.getHttpServer()).patch('/users/restore').query({ uuid: 'invalid' }).expect(400);
    });

    it('PATCH /users/restore should restore a user for valid uuid', async () => {
        usersServiceMock.restore.mockResolvedValue({ id: 1, uuid: validUuid, ...createDto });

        await request(app.getHttpServer()).patch('/users/restore').query({ uuid: validUuid }).expect(200);
    });

    it('PATCH /users/restore should propagate service internal errors', async () => {
        usersServiceMock.restore.mockRejectedValue(new InternalServerErrorException('DB unavailable'));

        await request(app.getHttpServer()).patch('/users/restore').query({ uuid: validUuid }).expect(500);
    });
});