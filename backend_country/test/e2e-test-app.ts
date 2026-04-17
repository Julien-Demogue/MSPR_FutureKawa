import { BadRequestException, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AlertsController } from './../src/alerts/alerts.controller';
import { AlertsService } from './../src/alerts/alerts.service';
import { AppController } from './../src/app.controller';
import { AppService } from './../src/app.service';
import { BatchesController } from './../src/batches/batches.controller';
import { BatchesService } from './../src/batches/batches.service';
import { CountriesController } from './../src/countries/countries.controller';
import { CountriesService } from './../src/countries/countries.service';
import { FarmsController } from './../src/farms/farms.controller';
import { FarmsService } from './../src/farms/farms.service';
import { StatementsController } from './../src/statements/statements.controller';
import { StatementsService } from './../src/statements/statements.service';
import { StatusesController } from './../src/statuses/statuses.controller';
import { StatusesService } from './../src/statuses/statuses.service';
import { WarehousesController } from './../src/warehouses/warehouses.controller';
import { WarehousesService } from './../src/warehouses/warehouses.service';

jest.mock('uuid', () => ({
    v4: jest.fn(() => '00000000-0000-0000-0000-000000000000'),
}));

export type ResourceKey =
    | 'countries'
    | 'farms'
    | 'warehouses'
    | 'batches'
    | 'statuses'
    | 'statements'
    | 'alerts';

export type CrudLikeMock = {
    create: jest.Mock;
    findAll: jest.Mock;
    findOneByUuid: jest.Mock;
    findOneById: jest.Mock;
    findOneByName: jest.Mock;
    findAllByValue: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
    restore: jest.Mock;
};

export type ServiceMocks = Record<ResourceKey, CrudLikeMock>;

export const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';

const RESOURCE_KEYS: ResourceKey[] = [
    'countries',
    'farms',
    'warehouses',
    'batches',
    'statuses',
    'statements',
    'alerts',
];

const createCrudLikeMock = (): CrudLikeMock => ({
    create: jest.fn(),
    findAll: jest.fn(),
    findOneByUuid: jest.fn(),
    findOneById: jest.fn(),
    findOneByName: jest.fn(),
    findAllByValue: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    restore: jest.fn(),
});

const createServiceMocks = (): ServiceMocks => ({
    countries: createCrudLikeMock(),
    farms: createCrudLikeMock(),
    warehouses: createCrudLikeMock(),
    batches: createCrudLikeMock(),
    statuses: createCrudLikeMock(),
    statements: createCrudLikeMock(),
    alerts: createCrudLikeMock(),
});

export const setDefaultServiceResponses = (serviceMocks: ServiceMocks) => {
    for (const key of RESOURCE_KEYS) {
        const mock = serviceMocks[key];
        const entity = {
            id: 1,
            uuid: VALID_UUID,
            label: `${key}-item`,
        };

        mock.create.mockResolvedValue(entity);
        mock.findAll.mockResolvedValue([entity]);
        mock.findOneByUuid.mockResolvedValue(entity);
        mock.findOneById.mockResolvedValue(entity);
        mock.findOneByName.mockResolvedValue(entity);
        mock.findAllByValue.mockResolvedValue([entity]);
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
        controllers: [
            AppController,
            CountriesController,
            FarmsController,
            WarehousesController,
            BatchesController,
            StatusesController,
            StatementsController,
            AlertsController,
        ],
        providers: [
            { provide: AppService, useValue: appServiceMock },
            { provide: CountriesService, useValue: serviceMocks.countries },
            { provide: FarmsService, useValue: serviceMocks.farms },
            { provide: WarehousesService, useValue: serviceMocks.warehouses },
            { provide: BatchesService, useValue: serviceMocks.batches },
            { provide: StatusesService, useValue: serviceMocks.statuses },
            { provide: StatementsService, useValue: serviceMocks.statements },
            { provide: AlertsService, useValue: serviceMocks.alerts },
        ],
    }).compile();

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
            const response = await request(app.getHttpServer())
                .post(basePath)
                .send({ label: 'new-item' })
                .expect(201);

            expect(response.body).toEqual(
                expect.objectContaining({
                    uuid: VALID_UUID,
                }),
            );
        });

        it(`GET ${basePath}`, async () => {
            const response = await request(app.getHttpServer()).get(basePath).expect(200);

            expect(response.body).toHaveLength(1);
        });

        it(`GET ${basePath}/uuid validates uuid`, async () => {
            await request(app.getHttpServer())
                .get(`${basePath}/uuid`)
                .query({ uuid: 'not-a-uuid' })
                .expect(400);
        });

        it(`GET ${basePath}/uuid returns one item`, async () => {
            const response = await request(app.getHttpServer())
                .get(`${basePath}/uuid`)
                .query({ uuid: VALID_UUID })
                .expect(200);

            expect(response.body).toEqual(
                expect.objectContaining({
                    uuid: VALID_UUID,
                }),
            );
        });

        it(`GET ${basePath}/id validates integer id`, async () => {
            await request(app.getHttpServer())
                .get(`${basePath}/id`)
                .query({ id: 'abc' })
                .expect(400);
        });

        it(`GET ${basePath}/id returns one item`, async () => {
            const response = await request(app.getHttpServer())
                .get(`${basePath}/id`)
                .query({ id: 1 })
                .expect(200);

            expect(response.body).toEqual(
                expect.objectContaining({
                    id: 1,
                }),
            );
        });

        it(`PATCH ${basePath} validates uuid`, async () => {
            await request(app.getHttpServer())
                .patch(basePath)
                .query({ uuid: 'not-a-uuid' })
                .send({ label: 'updated' })
                .expect(400);
        });

        it(`PATCH ${basePath} updates one item`, async () => {
            const response = await request(app.getHttpServer())
                .patch(basePath)
                .query({ uuid: VALID_UUID })
                .send({ label: 'updated' })
                .expect(200);

            expect(response.body).toEqual(
                expect.objectContaining({
                    uuid: VALID_UUID,
                }),
            );
        });

        it(`DELETE ${basePath} validates uuid`, async () => {
            await request(app.getHttpServer())
                .delete(basePath)
                .query({ uuid: 'not-a-uuid' })
                .expect(400);
        });

        it(`DELETE ${basePath} removes one item`, async () => {
            await request(app.getHttpServer())
                .delete(basePath)
                .query({ uuid: VALID_UUID })
                .expect(204);
        });

        it(`PATCH ${basePath}/restore validates uuid`, async () => {
            await request(app.getHttpServer())
                .patch(`${basePath}/restore`)
                .query({ uuid: 'not-a-uuid' })
                .expect(400);
        });

        it(`PATCH ${basePath}/restore restores one item`, async () => {
            const response = await request(app.getHttpServer())
                .patch(`${basePath}/restore`)
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

            await request(app.getHttpServer()).get(basePath).expect(400);
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
