import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import request from 'supertest';
import { WarehousesController } from './warehouses.controller';
import { WarehousesService } from './warehouses.service';
import { ServiceAuthGuard } from '../utils/guards/service-auth.guard';

jest.mock('uuid', () => ({
  v4: jest.fn(() => '550e8400-e29b-41d4-a716-446655440000'),
}));

describe('WarehousesController', () => {
  let app: INestApplication;
  const validUuid = '550e8400-e29b-41d4-a716-446655440000';
  const warehousesServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOneByUuid: jest.fn(),
    findOneById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    restore: jest.fn(),
  };

  const createDto = {
    name: 'Warehouse A',
    id_farm: 1,
  };

  beforeAll(async () => {
    const allowGuard = {
      canActivate: jest.fn(() => true),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WarehousesController],
      providers: [
        {
          provide: WarehousesService,
          useValue: warehousesServiceMock,
        },
      ],
    })
      .overrideGuard(ServiceAuthGuard)
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

  it('POST /warehouses should create a warehouse', async () => {
    warehousesServiceMock.create.mockResolvedValue({ id: 1, uuid: validUuid, ...createDto });

    await request(app.getHttpServer()).post('/warehouses').send(createDto).expect(201);
  });

  it('POST /warehouses should propagate service internal errors', async () => {
    warehousesServiceMock.create.mockRejectedValue(new InternalServerErrorException('DB unavailable'));

    await request(app.getHttpServer()).post('/warehouses').send(createDto).expect(500);
  });

  it('GET /warehouses should return all warehouses', async () => {
    warehousesServiceMock.findAll.mockResolvedValue([{ id: 1, uuid: validUuid, ...createDto }]);

    await request(app.getHttpServer()).get('/warehouses').expect(200);
  });

  it('GET /warehouses should propagate service internal errors', async () => {
    warehousesServiceMock.findAll.mockRejectedValue(new InternalServerErrorException('DB unavailable'));

    await request(app.getHttpServer()).get('/warehouses').expect(500);
  });

  it('GET /warehouses/uuid should return 400 for invalid uuid', async () => {
    await request(app.getHttpServer()).get('/warehouses/uuid').query({ uuid: 'invalid' }).expect(400);
  });

  it('GET /warehouses/uuid should return one warehouse for valid uuid', async () => {
    warehousesServiceMock.findOneByUuid.mockResolvedValue({ id: 1, uuid: validUuid, ...createDto });

    await request(app.getHttpServer()).get('/warehouses/uuid').query({ uuid: validUuid }).expect(200);
  });

  it('GET /warehouses/uuid should propagate service not found errors for valid uuid', async () => {
    warehousesServiceMock.findOneByUuid.mockRejectedValue(new BadRequestException('Warehouse not found'));

    await request(app.getHttpServer()).get('/warehouses/uuid').query({ uuid: validUuid }).expect(400);
  });

  it('GET /warehouses/id should return 400 for invalid id', async () => {
    await request(app.getHttpServer()).get('/warehouses/id').query({ id: 'x' }).expect(400);
  });

  it('GET /warehouses/id should return one warehouse for valid id', async () => {
    warehousesServiceMock.findOneById.mockResolvedValue({ id: 1, uuid: validUuid, ...createDto });

    await request(app.getHttpServer()).get('/warehouses/id').query({ id: 1 }).expect(200);
  });

  it('PATCH /warehouses should return 400 for invalid uuid', async () => {
    await request(app.getHttpServer())
      .patch('/warehouses')
      .query({ uuid: 'invalid' })
      .send({ name: 'Warehouse B' })
      .expect(400);
  });

  it('PATCH /warehouses should update warehouse for valid uuid', async () => {
    warehousesServiceMock.update.mockResolvedValue({ id: 1, uuid: validUuid, ...createDto, name: 'Warehouse B' });

    await request(app.getHttpServer())
      .patch('/warehouses')
      .query({ uuid: validUuid })
      .send({ name: 'Warehouse B' })
      .expect(200);
  });

  it('PATCH /warehouses should propagate service internal errors', async () => {
    warehousesServiceMock.update.mockRejectedValue(new InternalServerErrorException('DB unavailable'));

    await request(app.getHttpServer()).patch('/warehouses').query({ uuid: validUuid }).send({ name: 'Warehouse B' }).expect(500);
  });

  it('DELETE /warehouses should return 400 for invalid uuid', async () => {
    await request(app.getHttpServer()).delete('/warehouses').query({ uuid: 'invalid' }).expect(400);
  });

  it('DELETE /warehouses should delete warehouse for valid uuid', async () => {
    warehousesServiceMock.remove.mockResolvedValue(undefined);

    await request(app.getHttpServer()).delete('/warehouses').query({ uuid: validUuid }).expect(204);
  });

  it('DELETE /warehouses should propagate service internal errors', async () => {
    warehousesServiceMock.remove.mockRejectedValue(new InternalServerErrorException('DB unavailable'));

    await request(app.getHttpServer()).delete('/warehouses').query({ uuid: validUuid }).expect(500);
  });

  it('PATCH /warehouses/restore should return 400 for invalid uuid', async () => {
    await request(app.getHttpServer()).patch('/warehouses/restore').query({ uuid: 'invalid' }).expect(400);
  });

  it('PATCH /warehouses/restore should restore warehouse for valid uuid', async () => {
    warehousesServiceMock.restore.mockResolvedValue({ id: 1, uuid: validUuid, ...createDto });

    await request(app.getHttpServer()).patch('/warehouses/restore').query({ uuid: validUuid }).expect(200);
  });

  it('PATCH /warehouses/restore should propagate service internal errors', async () => {
    warehousesServiceMock.restore.mockRejectedValue(new InternalServerErrorException('DB unavailable'));

    await request(app.getHttpServer()).patch('/warehouses/restore').query({ uuid: validUuid }).expect(500);
  });
});
