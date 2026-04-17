import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import request from 'supertest';
import { BatchesController } from './batches.controller';
import { BatchesService } from './batches.service';

jest.mock('uuid', () => ({
  v4: jest.fn(() => '550e8400-e29b-41d4-a716-446655440000'),
}));

describe('BatchesController', () => {
  let app: INestApplication;
  const validUuid = '550e8400-e29b-41d4-a716-446655440000';
  const batchesServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOneByUuid: jest.fn(),
    findOneById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    restore: jest.fn(),
  };

  const createDto = {
    id_warehouse: 1,
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BatchesController],
      providers: [
        {
          provide: BatchesService,
          useValue: batchesServiceMock,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /batches should create a batch', async () => {
    batchesServiceMock.create.mockResolvedValue({ id: 1, uuid: validUuid, ...createDto });

    await request(app.getHttpServer()).post('/batches').send(createDto).expect(201);
  });

  it('POST /batches should propagate service internal errors', async () => {
    batchesServiceMock.create.mockRejectedValue(new InternalServerErrorException('DB unavailable'));

    await request(app.getHttpServer()).post('/batches').send(createDto).expect(500);
  });

  it('GET /batches should return all batches', async () => {
    batchesServiceMock.findAll.mockResolvedValue([{ id: 1, uuid: validUuid, ...createDto }]);

    await request(app.getHttpServer()).get('/batches').expect(200);
  });

  it('GET /batches should propagate service internal errors', async () => {
    batchesServiceMock.findAll.mockRejectedValue(new InternalServerErrorException('DB unavailable'));

    await request(app.getHttpServer()).get('/batches').expect(500);
  });

  it('GET /batches/uuid should return 400 for invalid uuid', async () => {
    await request(app.getHttpServer()).get('/batches/uuid').query({ uuid: 'invalid' }).expect(400);
  });

  it('GET /batches/uuid should return a batch for valid uuid', async () => {
    batchesServiceMock.findOneByUuid.mockResolvedValue({ id: 1, uuid: validUuid, ...createDto });

    await request(app.getHttpServer()).get('/batches/uuid').query({ uuid: validUuid }).expect(200);
  });

  it('GET /batches/uuid should propagate service not found errors for valid uuid', async () => {
    batchesServiceMock.findOneByUuid.mockRejectedValue(new BadRequestException('Batch not found'));

    await request(app.getHttpServer()).get('/batches/uuid').query({ uuid: validUuid }).expect(400);
  });

  it('GET /batches/id should return 400 for invalid id', async () => {
    await request(app.getHttpServer()).get('/batches/id').query({ id: 'x' }).expect(400);
  });

  it('GET /batches/id should return a batch for valid id', async () => {
    batchesServiceMock.findOneById.mockResolvedValue({ id: 1, uuid: validUuid, ...createDto });

    await request(app.getHttpServer()).get('/batches/id').query({ id: 1 }).expect(200);
  });

  it('PATCH /batches should return 400 for invalid uuid', async () => {
    await request(app.getHttpServer()).patch('/batches').query({ uuid: 'invalid' }).send({ id_warehouse: 2 }).expect(400);
  });

  it('PATCH /batches should update a batch for valid uuid', async () => {
    batchesServiceMock.update.mockResolvedValue({ id: 1, uuid: validUuid, id_warehouse: 2 });

    await request(app.getHttpServer())
      .patch('/batches')
      .query({ uuid: validUuid })
      .send({ id_warehouse: 2 })
      .expect(200);
  });

  it('PATCH /batches should propagate service internal errors', async () => {
    batchesServiceMock.update.mockRejectedValue(new InternalServerErrorException('DB unavailable'));

    await request(app.getHttpServer()).patch('/batches').query({ uuid: validUuid }).send({ id_warehouse: 2 }).expect(500);
  });

  it('DELETE /batches should return 400 for invalid uuid', async () => {
    await request(app.getHttpServer()).delete('/batches').query({ uuid: 'invalid' }).expect(400);
  });

  it('DELETE /batches should delete a batch for valid uuid', async () => {
    batchesServiceMock.remove.mockResolvedValue(undefined);

    await request(app.getHttpServer()).delete('/batches').query({ uuid: validUuid }).expect(204);
  });

  it('DELETE /batches should propagate service internal errors', async () => {
    batchesServiceMock.remove.mockRejectedValue(new InternalServerErrorException('DB unavailable'));

    await request(app.getHttpServer()).delete('/batches').query({ uuid: validUuid }).expect(500);
  });

  it('PATCH /batches/restore should return 400 for invalid uuid', async () => {
    await request(app.getHttpServer()).patch('/batches/restore').query({ uuid: 'invalid' }).expect(400);
  });

  it('PATCH /batches/restore should restore a batch for valid uuid', async () => {
    batchesServiceMock.restore.mockResolvedValue({ id: 1, uuid: validUuid, ...createDto });

    await request(app.getHttpServer()).patch('/batches/restore').query({ uuid: validUuid }).expect(200);
  });

  it('PATCH /batches/restore should propagate service internal errors', async () => {
    batchesServiceMock.restore.mockRejectedValue(new InternalServerErrorException('DB unavailable'));

    await request(app.getHttpServer()).patch('/batches/restore').query({ uuid: validUuid }).expect(500);
  });
});
