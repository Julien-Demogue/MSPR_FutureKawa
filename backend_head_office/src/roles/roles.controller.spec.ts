import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { Role } from './role.entity';
import { User } from '../users/user.entity';
import { LoginGuard } from '../utils/guards/login.guard';
import { RoleGuard } from '../utils/guards/role.guard';

describe('Roles Integration Test', () => {
    let app: INestApplication;
    let createdRoleUuid: string;

    const createDto = {
        label: 'Admin',
    };

    beforeAll(async () => {
        const allowGuard = {
            canActivate: jest.fn(() => true),
        };

        const module: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    type: 'sqlite',
                    database: ':memory:',
                    entities: [Role, User],
                    synchronize: true,
                    logging: false,
                }),
                TypeOrmModule.forFeature([Role]),
            ],
            controllers: [RolesController],
            providers: [RolesService],
        })
            .overrideGuard(LoginGuard)
            .useValue(allowGuard)
            .overrideGuard(RoleGuard)
            .useValue(allowGuard)
            .compile();

        app = module.createNestApplication();

        app.useGlobalPipes(new ValidationPipe());
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    it('POST /roles should actually save a role in the database', async () => {
        const response = await request(app.getHttpServer())
            .post('/roles')
            .send(createDto)
            .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('uuid');
        expect(response.body.label).toBe('Admin');

        createdRoleUuid = response.body.uuid;
    });

    it('GET /roles should return the previously inserted roles', async () => {
        const response = await request(app.getHttpServer())
            .get('/roles')
            .expect(200);

        expect(Array.isArray(response.body)).toBeTruthy();
        expect(response.body.length).toBe(1);
        expect(response.body[0].uuid).toBe(createdRoleUuid);
    });

    it('GET /roles/uuid should return 400 for a malformed uuid', async () => {
        await request(app.getHttpServer())
            .get('/roles/uuid')
            .query({ uuid: 'not-a-real-uuid' })
            .expect(400);
    });

    it('GET /roles/uuid should retrieve the specific role from the database', async () => {
        const response = await request(app.getHttpServer())
            .get('/roles/uuid')
            .query({ uuid: createdRoleUuid })
            .expect(200);

        expect(response.body.label).toBe('Admin');
    });

    it('PATCH /roles should update the database record', async () => {
        const updateResponse = await request(app.getHttpServer())
            .patch('/roles')
            .query({ uuid: createdRoleUuid })
            .send({ label: 'SuperAdmin' })
            .expect(200);

        expect(updateResponse.body.label).toBe('SuperAdmin');
    });

    it('DELETE /roles should perform a soft delete in the database', async () => {
        await request(app.getHttpServer())
            .delete('/roles')
            .query({ uuid: createdRoleUuid })
            .expect(204);

        const getResponse = await request(app.getHttpServer())
            .get('/roles/uuid')
            .query({ uuid: createdRoleUuid })
            .expect(400);
    });

    it('PATCH /roles/restore should restore the soft deleted record', async () => {
        const restoreResponse = await request(app.getHttpServer())
            .patch('/roles/restore')
            .query({ uuid: createdRoleUuid })
            .expect(200);

        expect(restoreResponse.body.label).toBe('SuperAdmin');
    });
});