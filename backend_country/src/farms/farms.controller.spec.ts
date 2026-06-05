import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import request from 'supertest';
import { FarmsController } from './farms.controller';
import { FarmsService } from './farms.service';
import { ServiceAuthGuard } from '../utils/guards/service-auth.guard';

jest.mock('uuid', () => ({
  v4: jest.fn(() => '550e8400-e29b-41d4-a716-446655440000'),
}));

describe('FarmsController', () => {
  let app: INestApplication;
  const validUuid = '550e8400-e29b-41d4-a716-446655440000';
  const farmsServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOneByUuid: jest.fn(),
    findOneById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    restore: jest.fn(),
  };

  const createDto = {
    name: 'Farm A',
    id_country: 1,
  };

  beforeAll(async () => {
    const allowGuard = {
      canActivate: jest.fn(() => true),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FarmsController],
      providers: [
        {
          provide: FarmsService,
          useValue: farmsServiceMock,
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

  it('POST /farms should create a farm', async () => {
    farmsServiceMock.create.mockResolvedValue({ id: 1, uuid: validUuid, ...createDto });

    await request(app.getHttpServer())
      .post('/farms')
      .send(createDto)
      .expect(201)
      .expect(({ body }) => {
        expect(body.uuid).toBe(validUuid);
      });
  });

  it('POST /farms should propagate service internal errors', async () => {
    farmsServiceMock.create.mockRejectedValue(new InternalServerErrorException('DB unavailable'));

    await request(app.getHttpServer()).post('/farms').send(createDto).expect(500);
  });

  it('GET /farms should return all farms', async () => {
    farmsServiceMock.findAll.mockResolvedValue([{ id: 1, uuid: validUuid, ...createDto }]);

    await request(app.getHttpServer()).get('/farms').expect(200).expect(({ body }) => {
      expect(body).toHaveLength(1);
    });
  });

  it('GET /farms should propagate service internal errors', async () => {
    farmsServiceMock.findAll.mockRejectedValue(new InternalServerErrorException('DB unavailable'));

    await request(app.getHttpServer()).get('/farms').expect(500);
  });

  it('GET /farms/uuid should return 400 for an invalid uuid', async () => {
    await request(app.getHttpServer()).get('/farms/uuid').query({ uuid: 'invalid' }).expect(400);
  });

  it('GET /farms/uuid should return a farm with a valid uuid', async () => {
    farmsServiceMock.findOneByUuid.mockResolvedValue({ id: 1, uuid: validUuid, ...createDto });

    await request(app.getHttpServer())
      .get('/farms/uuid')
      .query({ uuid: validUuid })
      .expect(200)
      .expect(({ body }) => {
        expect(body.id_country).toBe(1);
      });
  });

  it('GET /farms/uuid should propagate service not found errors for valid uuid', async () => {
    farmsServiceMock.findOneByUuid.mockRejectedValue(new BadRequestException('Farm not found'));

    await request(app.getHttpServer()).get('/farms/uuid').query({ uuid: validUuid }).expect(400);
  });

  it('GET /farms/id should return 400 for an invalid id', async () => {
    await request(app.getHttpServer()).get('/farms/id').query({ id: 'invalid' }).expect(400);
  });

  it('GET /farms/id should return a farm with a valid id', async () => {
    farmsServiceMock.findOneById.mockResolvedValue({ id: 1, uuid: validUuid, ...createDto });

    await request(app.getHttpServer()).get('/farms/id').query({ id: 1 }).expect(200);
  });

  it('PATCH /farms should return 400 for an invalid uuid', async () => {
    await request(app.getHttpServer()).patch('/farms').query({ uuid: 'invalid' }).send({ name: 'X' }).expect(400);
  });

  it('PATCH /farms should update a farm with a valid uuid', async () => {
    farmsServiceMock.update.mockResolvedValue({ id: 1, uuid: validUuid, ...createDto, name: 'Farm B' });

    await request(app.getHttpServer())
      .patch('/farms')
      .query({ uuid: validUuid })
      .send({ name: 'Farm B' })
      .expect(200)
      .expect(({ body }) => {
        expect(body.name).toBe('Farm B');
      });
  });

  it('PATCH /farms should propagate service internal errors', async () => {
    farmsServiceMock.update.mockRejectedValue(new InternalServerErrorException('DB unavailable'));

    await request(app.getHttpServer()).patch('/farms').query({ uuid: validUuid }).send({ name: 'Farm B' }).expect(500);
  });

  it('DELETE /farms should return 400 for an invalid uuid', async () => {
    await request(app.getHttpServer()).delete('/farms').query({ uuid: 'invalid' }).expect(400);
  });

  it('DELETE /farms should delete a farm with a valid uuid', async () => {
    farmsServiceMock.remove.mockResolvedValue(undefined);

    await request(app.getHttpServer()).delete('/farms').query({ uuid: validUuid }).expect(204);
  });

  it('DELETE /farms should propagate service internal errors', async () => {
    farmsServiceMock.remove.mockRejectedValue(new InternalServerErrorException('DB unavailable'));

    await request(app.getHttpServer()).delete('/farms').query({ uuid: validUuid }).expect(500);
  });

  it('PATCH /farms/restore should return 400 for an invalid uuid', async () => {
    await request(app.getHttpServer()).patch('/farms/restore').query({ uuid: 'invalid' }).expect(400);
  });

  it('PATCH /farms/restore should restore a farm with a valid uuid', async () => {
    farmsServiceMock.restore.mockResolvedValue({ id: 1, uuid: validUuid, ...createDto });

    await request(app.getHttpServer())
      .patch('/farms/restore')
      .query({ uuid: validUuid })
      .expect(200)
      .expect(({ body }) => {
        expect(body.uuid).toBe(validUuid);
      });
  });

  it('PATCH /farms/restore should propagate service internal errors', async () => {
    farmsServiceMock.restore.mockRejectedValue(new InternalServerErrorException('DB unavailable'));

    await request(app.getHttpServer()).patch('/farms/restore').query({ uuid: validUuid }).expect(500);
  });
});
