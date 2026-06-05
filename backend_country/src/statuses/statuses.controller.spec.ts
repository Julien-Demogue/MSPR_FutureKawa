import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import request from 'supertest';
import { StatusesController } from './statuses.controller';
import { StatusesService } from './statuses.service';
import { ServiceAuthGuard } from '../utils/guards/service-auth.guard';

jest.mock('uuid', () => ({
  v4: jest.fn(() => '550e8400-e29b-41d4-a716-446655440000'),
}));

describe('StatusesController', () => {
  let app: INestApplication;
  const validUuid = '550e8400-e29b-41d4-a716-446655440000';
  const statusesServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOneByUuid: jest.fn(),
    findOneById: jest.fn(),
    findAllByValue: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    restore: jest.fn(),
  };

  const createDto = {
    value: 'OK',
    id_batch: 1,
  };

  beforeAll(async () => {
    const allowGuard = {
      canActivate: jest.fn(() => true),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StatusesController],
      providers: [
        {
          provide: StatusesService,
          useValue: statusesServiceMock,
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

  it('POST /statuses should create a status', async () => {
    statusesServiceMock.create.mockResolvedValue({ id: 1, uuid: validUuid, ...createDto });
    await request(app.getHttpServer()).post('/statuses').send(createDto).expect(201);
  });

  it('POST /statuses should propagate service internal errors', async () => {
    statusesServiceMock.create.mockRejectedValue(new InternalServerErrorException('DB unavailable'));

    await request(app.getHttpServer()).post('/statuses').send(createDto).expect(500);
  });

  it('GET /statuses should return all statuses', async () => {
    statusesServiceMock.findAll.mockResolvedValue([{ id: 1, uuid: validUuid, ...createDto }]);
    await request(app.getHttpServer()).get('/statuses').expect(200);
  });

  it('GET /statuses should propagate service internal errors', async () => {
    statusesServiceMock.findAll.mockRejectedValue(new InternalServerErrorException('DB unavailable'));

    await request(app.getHttpServer()).get('/statuses').expect(500);
  });

  it('GET /statuses/uuid should return 400 for invalid uuid', async () => {
    await request(app.getHttpServer()).get('/statuses/uuid').query({ uuid: 'invalid' }).expect(400);
  });

  it('GET /statuses/uuid should return one status for valid uuid', async () => {
    statusesServiceMock.findOneByUuid.mockResolvedValue({ id: 1, uuid: validUuid, ...createDto });
    await request(app.getHttpServer()).get('/statuses/uuid').query({ uuid: validUuid }).expect(200);
  });

  it('GET /statuses/uuid should propagate service not found errors for valid uuid', async () => {
    statusesServiceMock.findOneByUuid.mockRejectedValue(new BadRequestException('Status not found'));

    await request(app.getHttpServer()).get('/statuses/uuid').query({ uuid: validUuid }).expect(400);
  });

  it('GET /statuses/id should return 400 for invalid id', async () => {
    await request(app.getHttpServer()).get('/statuses/id').query({ id: 'abc' }).expect(400);
  });

  it('GET /statuses/id should return one status for valid id', async () => {
    statusesServiceMock.findOneById.mockResolvedValue({ id: 1, uuid: validUuid, ...createDto });
    await request(app.getHttpServer()).get('/statuses/id').query({ id: 1 }).expect(200);
  });

  it('GET /statuses/value should return statuses for a valid value', async () => {
    statusesServiceMock.findAllByValue.mockResolvedValue([{ id: 1, uuid: validUuid, ...createDto }]);

    await request(app.getHttpServer())
      .get('/statuses/value')
      .query({ value: 'OK' })
      .expect(200)
      .expect(({ body }) => {
        expect(body).toHaveLength(1);
      });
  });

  it('GET /statuses/value should propagate service validation errors', async () => {
    statusesServiceMock.findAllByValue.mockRejectedValue(new BadRequestException('Invalid value'));

    await request(app.getHttpServer()).get('/statuses/value').query({ value: 'UNKNOWN' }).expect(400);
  });

  it('PATCH /statuses should return 400 for invalid uuid', async () => {
    await request(app.getHttpServer()).patch('/statuses').query({ uuid: 'invalid' }).send({ value: 'ALERT' }).expect(400);
  });

  it('PATCH /statuses should update a status for valid uuid', async () => {
    statusesServiceMock.update.mockResolvedValue({ id: 1, uuid: validUuid, id_batch: 1, value: 'ALERT' });

    await request(app.getHttpServer())
      .patch('/statuses')
      .query({ uuid: validUuid })
      .send({ value: 'ALERT' })
      .expect(200);
  });

  it('PATCH /statuses should propagate service internal errors', async () => {
    statusesServiceMock.update.mockRejectedValue(new InternalServerErrorException('DB unavailable'));

    await request(app.getHttpServer()).patch('/statuses').query({ uuid: validUuid }).send({ value: 'ALERT' }).expect(500);
  });

  it('DELETE /statuses should return 400 for invalid uuid', async () => {
    await request(app.getHttpServer()).delete('/statuses').query({ uuid: 'invalid' }).expect(400);
  });

  it('DELETE /statuses should delete a status for valid uuid', async () => {
    statusesServiceMock.remove.mockResolvedValue(undefined);
    await request(app.getHttpServer()).delete('/statuses').query({ uuid: validUuid }).expect(204);
  });

  it('DELETE /statuses should propagate service internal errors', async () => {
    statusesServiceMock.remove.mockRejectedValue(new InternalServerErrorException('DB unavailable'));

    await request(app.getHttpServer()).delete('/statuses').query({ uuid: validUuid }).expect(500);
  });

  it('PATCH /statuses/restore should return 400 for invalid uuid', async () => {
    await request(app.getHttpServer()).patch('/statuses/restore').query({ uuid: 'invalid' }).expect(400);
  });

  it('PATCH /statuses/restore should restore a status for valid uuid', async () => {
    statusesServiceMock.restore.mockResolvedValue({ id: 1, uuid: validUuid, ...createDto });
    await request(app.getHttpServer()).patch('/statuses/restore').query({ uuid: validUuid }).expect(200);
  });

  it('PATCH /statuses/restore should propagate service internal errors', async () => {
    statusesServiceMock.restore.mockRejectedValue(new InternalServerErrorException('DB unavailable'));

    await request(app.getHttpServer()).patch('/statuses/restore').query({ uuid: validUuid }).expect(500);
  });
});
