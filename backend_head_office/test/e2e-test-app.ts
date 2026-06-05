import { BadRequestException, CanActivate, ExecutionContext, INestApplication, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { Test as SupertestTest } from 'supertest';
import { AppController } from './../src/app.controller';
import { AppService } from './../src/app.service';
import { RolesController } from './../src/roles/roles.controller';
import { RolesService } from './../src/roles/roles.service';
import { UsersController } from './../src/users/users.controller';
import { UsersService } from './../src/users/users.service';
import { LoginGuard } from './../src/utils/guards/login.guard';
import { AppRole } from './../src/utils/constants/roles.constant';

jest.mock('uuid', () => ({
    v4: jest.fn(() => '00000000-0000-0000-0000-000000000000'),
}));

export type ResourceKey = 'roles' | 'users';

export type CrudLikeMock = {
    create: jest.Mock;
    findAll: jest.Mock;
    findOneByUuid: jest.Mock;
    findOneById: jest.Mock;
    findOneByLabel: jest.Mock;
    findOneByEmail: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
    restore: jest.Mock;
};

export type ServiceMocks = Record<ResourceKey, CrudLikeMock>;

export const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';

const DEFAULT_ROLE = AppRole.SUPERADMIN;
const TEST_AUTH_HEADER = 'authorization';
const TEST_ROLE_HEADER = 'x-test-role';

const RESOURCE_KEYS: ResourceKey[] = ['roles', 'users'];

const createCrudLikeMock = (): CrudLikeMock => ({
    create: jest.fn(),
    findAll: jest.fn(),
    findOneByUuid: jest.fn(),
    findOneById: jest.fn(),
    findOneByLabel: jest.fn(),
    findOneByEmail: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    restore: jest.fn(),
});

const createServiceMocks = (): ServiceMocks => ({
    roles: createCrudLikeMock(),
    users: createCrudLikeMock(),
});

const createDefaultEntity = (key: ResourceKey) => {
    if (key === 'users') {
        return {
            id: 1,
            uuid: VALID_UUID,
            first_name: 'John',
            last_name: 'Doe',
            email: 'john.doe@example.com',
            id_role: 1,
            role: { id: 1, label: 'Admin' },
        };
    }

    return {
        id: 1,
        uuid: VALID_UUID,
        label: 'Admin',
    };
};

export const getAuthHeaders = (role: AppRole = DEFAULT_ROLE) => ({
    [TEST_AUTH_HEADER]: 'Bearer test-token',
    [TEST_ROLE_HEADER]: role,
});

class TestLoginGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers[TEST_AUTH_HEADER];

        if (!authHeader) {
            throw new UnauthorizedException('Missing authorization header');
        }

        request.user = {
            sub: VALID_UUID,
            role_label: request.headers[TEST_ROLE_HEADER] ?? DEFAULT_ROLE,
        };

        return true;
    }
}

export const setDefaultServiceResponses = (serviceMocks: ServiceMocks) => {
    for (const key of RESOURCE_KEYS) {
        const mock = serviceMocks[key];
        const entity = createDefaultEntity(key);

        mock.create.mockResolvedValue(entity);
        mock.findAll.mockResolvedValue([entity]);
        mock.findOneByUuid.mockResolvedValue(entity);
        mock.findOneById.mockResolvedValue(entity);
        mock.findOneByLabel.mockResolvedValue(entity);
        mock.findOneByEmail.mockResolvedValue(entity);
        mock.update.mockResolvedValue(entity);
        mock.remove.mockResolvedValue(entity);
        mock.restore.mockResolvedValue(entity);
    }
};

export const createE2eTestingApp = async () => {
    const appServiceMock = {
        getHello: jest.fn(() => 'The API is working'),
    };
    const serviceMocks = createServiceMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
        controllers: [AppController, RolesController, UsersController],
        providers: [
            { provide: AppService, useValue: appServiceMock },
            { provide: RolesService, useValue: serviceMocks.roles },
            { provide: UsersService, useValue: serviceMocks.users },
        ],
    })
        .overrideGuard(LoginGuard)
        .useClass(TestLoginGuard)
        .compile();

    const app = moduleFixture.createNestApplication();
    await app.init();

    return { app, serviceMocks, appServiceMock };
};

type ResourceSuiteContext = {
    getApp: () => INestApplication;
    getServiceMocks: () => ServiceMocks;
};

export const describeCrudResourceE2e = (
    resourceKey: ResourceKey,
    basePath: string,
    extraTests?: (context: ResourceSuiteContext) => void,
) => {
    describe(`${basePath} routes (e2e)`, () => {
        let app: INestApplication;
        let serviceMocks: ServiceMocks;

        const withAuth = (req: SupertestTest, role: AppRole = DEFAULT_ROLE) =>
            req.set(getAuthHeaders(role));

        beforeAll(async () => {
            const context = await createE2eTestingApp();
            app = context.app;
            serviceMocks = context.serviceMocks;
        });

        beforeEach(() => {
            jest.clearAllMocks();
            setDefaultServiceResponses(serviceMocks);
        });

        it(`POST ${basePath}`, async () => {
            const payload = resourceKey === 'users'
                ? {
                    first_name: 'John',
                    last_name: 'Doe',
                    email: 'john.doe@example.com',
                    password: 'secret123',
                    id_role: 1,
                }
                : { label: 'Admin' };

            const response = await withAuth(request(app.getHttpServer())
                .post(basePath))
                .send(payload)
                .expect(201);

            expect(response.body).toEqual(
                expect.objectContaining({
                    uuid: VALID_UUID,
                }),
            );
        });

        it(`GET ${basePath}`, async () => {
            const response = await withAuth(request(app.getHttpServer()).get(basePath)).expect(200);

            expect(response.body).toHaveLength(1);
        });

        it(`GET ${basePath}/uuid validates uuid`, async () => {
            await withAuth(request(app.getHttpServer())
                .get(`${basePath}/uuid`))
                .query({ uuid: 'not-a-uuid' })
                .expect(400);
        });

        it(`GET ${basePath}/uuid returns one item`, async () => {
            const response = await withAuth(request(app.getHttpServer())
                .get(`${basePath}/uuid`))
                .query({ uuid: VALID_UUID })
                .expect(200);

            expect(response.body).toEqual(
                expect.objectContaining({
                    uuid: VALID_UUID,
                }),
            );
        });

        it(`GET ${basePath}/id validates integer id`, async () => {
            await withAuth(request(app.getHttpServer())
                .get(`${basePath}/id`))
                .query({ id: 'abc' })
                .expect(400);
        });

        it(`GET ${basePath}/id returns one item`, async () => {
            const response = await withAuth(request(app.getHttpServer())
                .get(`${basePath}/id`))
                .query({ id: 1 })
                .expect(200);

            expect(response.body).toEqual(
                expect.objectContaining({
                    id: 1,
                }),
            );
        });

        it(`PATCH ${basePath} validates uuid`, async () => {
            await withAuth(request(app.getHttpServer())
                .patch(basePath))
                .query({ uuid: 'not-a-uuid' })
                .send(resourceKey === 'users' ? { first_name: 'Jane' } : { label: 'Updated' })
                .expect(400);
        });

        it(`PATCH ${basePath} updates one item`, async () => {
            const response = await withAuth(request(app.getHttpServer())
                .patch(basePath))
                .query({ uuid: VALID_UUID })
                .send(resourceKey === 'users' ? { first_name: 'Jane' } : { label: 'Updated' })
                .expect(200);

            expect(response.body).toEqual(
                expect.objectContaining({
                    uuid: VALID_UUID,
                }),
            );
        });

        it(`DELETE ${basePath} validates uuid`, async () => {
            await withAuth(request(app.getHttpServer())
                .delete(basePath))
                .query({ uuid: 'not-a-uuid' })
                .expect(400);
        });

        it(`DELETE ${basePath} removes one item`, async () => {
            await withAuth(request(app.getHttpServer())
                .delete(basePath))
                .query({ uuid: VALID_UUID })
                .expect(204);
        });

        it(`PATCH ${basePath}/restore validates uuid`, async () => {
            await withAuth(request(app.getHttpServer())
                .patch(`${basePath}/restore`))
                .query({ uuid: 'not-a-uuid' })
                .expect(400);
        });

        it(`PATCH ${basePath}/restore restores one item`, async () => {
            const response = await withAuth(request(app.getHttpServer())
                .patch(`${basePath}/restore`))
                .query({ uuid: VALID_UUID })
                .expect(200);

            expect(response.body).toEqual(
                expect.objectContaining({
                    uuid: VALID_UUID,
                }),
            );
        });

        it(`GET ${basePath} propagates service errors`, async () => {
            serviceMocks[resourceKey].findAll.mockRejectedValueOnce(
                new BadRequestException('forced e2e error'),
            );

            await withAuth(request(app.getHttpServer()).get(basePath)).expect(400);
        });

        it(`GET ${basePath} without auth returns 401`, async () => {
            await request(app.getHttpServer()).get(basePath).expect(401);
        });

        it(`DELETE ${basePath} with ADMIN role returns 403`, async () => {
            await withAuth(request(app.getHttpServer())
                .delete(basePath), AppRole.ADMIN)
                .query({ uuid: VALID_UUID })
                .expect(403);
        });

        if (extraTests) {
            extraTests({
                getApp: () => app,
                getServiceMocks: () => serviceMocks,
            });
        }

        afterAll(async () => {
            await app.close();
        });
    });
};