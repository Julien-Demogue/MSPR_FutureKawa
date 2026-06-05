import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import request from 'supertest';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { LoginGuard } from '../utils/guards/login.guard';
import { RoleGuard } from '../utils/guards/role.guard';

jest.mock('uuid', () => ({
    v4: jest.fn(() => '550e8400-e29b-41d4-a716-446655440000'),
}));

describe('RolesController', () => {
    let app: INestApplication;
    const validUuid = '550e8400-e29b-41d4-a716-446655440000';
    const rolesServiceMock = {
        create: jest.fn(),
        findAll: jest.fn(),
        findOneByUuid: jest.fn(),
        findOneById: jest.fn(),
        findOneByLabel: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
        restore: jest.fn(),
    };

    const createDto = {
        label: 'Admin',
    };

    beforeAll(async () => {
        const allowGuard = {
            canActivate: jest.fn(() => true),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [RolesController],
            providers: [
                {
                    provide: RolesService,
                    useValue: rolesServiceMock,
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

    it('POST /roles should create a role', async () => {
        rolesServiceMock.create.mockResolvedValue({ id: 1, uuid: validUuid, ...createDto });

        await request(app.getHttpServer()).post('/roles').send(createDto).expect(201);
    });

    it('POST /roles should propagate service internal errors', async () => {
        rolesServiceMock.create.mockRejectedValue(new InternalServerErrorException('DB unavailable'));

        await request(app.getHttpServer()).post('/roles').send(createDto).expect(500);
    });

    it('GET /roles should return all roles', async () => {
        rolesServiceMock.findAll.mockResolvedValue([{ id: 1, uuid: validUuid, ...createDto }]);

        await request(app.getHttpServer()).get('/roles').expect(200);
    });

    it('GET /roles should propagate service internal errors', async () => {
        rolesServiceMock.findAll.mockRejectedValue(new InternalServerErrorException('DB unavailable'));

        await request(app.getHttpServer()).get('/roles').expect(500);
    });

    it('GET /roles/uuid should return 400 for invalid uuid', async () => {
        await request(app.getHttpServer()).get('/roles/uuid').query({ uuid: 'invalid' }).expect(400);
        expect(rolesServiceMock.findOneByUuid).not.toHaveBeenCalled();
    });

    it('GET /roles/uuid should return one role for valid uuid', async () => {
        rolesServiceMock.findOneByUuid.mockResolvedValue({ id: 1, uuid: validUuid, ...createDto });

        await request(app.getHttpServer()).get('/roles/uuid').query({ uuid: validUuid }).expect(200);
    });

    it('GET /roles/uuid should propagate service not found errors for valid uuid', async () => {
        rolesServiceMock.findOneByUuid.mockRejectedValue(new BadRequestException('Role not found'));

        await request(app.getHttpServer()).get('/roles/uuid').query({ uuid: validUuid }).expect(400);
    });

    it('GET /roles/id should return 400 for invalid id', async () => {
        await request(app.getHttpServer()).get('/roles/id').query({ id: 'x' }).expect(400);
        expect(rolesServiceMock.findOneById).not.toHaveBeenCalled();
    });

    it('GET /roles/id should return one role for valid id', async () => {
        rolesServiceMock.findOneById.mockResolvedValue({ id: 1, uuid: validUuid, ...createDto });

        await request(app.getHttpServer()).get('/roles/id').query({ id: 1 }).expect(200);
    });

    it('GET /roles/label should return 400 for invalid label', async () => {
        rolesServiceMock.findOneByLabel.mockRejectedValue(new BadRequestException('Invalid label'));

        await request(app.getHttpServer()).get('/roles/label').query({ label: '' }).expect(400);
    });

    it('GET /roles/label should return one role for valid label', async () => {
        rolesServiceMock.findOneByLabel.mockResolvedValue({ id: 1, uuid: validUuid, ...createDto });

        await request(app.getHttpServer()).get('/roles/label').query({ label: 'Admin' }).expect(200);
    });

    it('GET /roles/label should propagate service not found errors for valid label', async () => {
        rolesServiceMock.findOneByLabel.mockRejectedValue(new BadRequestException('Role not found'));

        await request(app.getHttpServer()).get('/roles/label').query({ label: 'Admin' }).expect(400);
    });

    it('PATCH /roles should return 400 for invalid uuid', async () => {
        await request(app.getHttpServer()).patch('/roles').query({ uuid: 'invalid' }).send({ label: 'Manager' }).expect(400);
    });

    it('PATCH /roles should update a role for valid uuid', async () => {
        rolesServiceMock.update.mockResolvedValue({ id: 1, uuid: validUuid, label: 'Manager' });

        await request(app.getHttpServer())
            .patch('/roles')
            .query({ uuid: validUuid })
            .send({ label: 'Manager' })
            .expect(200);
    });

    it('PATCH /roles should propagate service internal errors', async () => {
        rolesServiceMock.update.mockRejectedValue(new InternalServerErrorException('DB unavailable'));

        await request(app.getHttpServer()).patch('/roles').query({ uuid: validUuid }).send({ label: 'Manager' }).expect(500);
    });

    it('DELETE /roles should return 400 for invalid uuid', async () => {
        await request(app.getHttpServer()).delete('/roles').query({ uuid: 'invalid' }).expect(400);
    });

    it('DELETE /roles should delete a role for valid uuid', async () => {
        rolesServiceMock.remove.mockResolvedValue(undefined);

        await request(app.getHttpServer()).delete('/roles').query({ uuid: validUuid }).expect(204);
    });

    it('DELETE /roles should propagate service internal errors', async () => {
        rolesServiceMock.remove.mockRejectedValue(new InternalServerErrorException('DB unavailable'));

        await request(app.getHttpServer()).delete('/roles').query({ uuid: validUuid }).expect(500);
    });

    it('PATCH /roles/restore should return 400 for invalid uuid', async () => {
        await request(app.getHttpServer()).patch('/roles/restore').query({ uuid: 'invalid' }).expect(400);
    });

    it('PATCH /roles/restore should restore a role for valid uuid', async () => {
        rolesServiceMock.restore.mockResolvedValue({ id: 1, uuid: validUuid, ...createDto });

        await request(app.getHttpServer()).patch('/roles/restore').query({ uuid: validUuid }).expect(200);
    });

    it('PATCH /roles/restore should propagate service internal errors', async () => {
        rolesServiceMock.restore.mockRejectedValue(new InternalServerErrorException('DB unavailable'));

        await request(app.getHttpServer()).patch('/roles/restore').query({ uuid: validUuid }).expect(500);
    });
});