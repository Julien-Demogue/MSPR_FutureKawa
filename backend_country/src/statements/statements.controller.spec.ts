import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import request from 'supertest';
import { StatementsController } from './statements.controller';
import { StatementsService } from './statements.service';
import { ServiceAuthGuard } from '../utils/guards/service-auth.guard';

jest.mock('uuid', () => ({
  v4: jest.fn(() => '550e8400-e29b-41d4-a716-446655440000'),
}));

describe('StatementsController', () => {
  let app: INestApplication;
  const validUuid = '550e8400-e29b-41d4-a716-446655440000';
  const statementsServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findAllByType: jest.fn(),
    findOneByUuid: jest.fn(),
    findOneById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    restore: jest.fn(),
  };

  const createDto = {
    temperature: 23.5,
    humidity: 60,
    id_warehouse: 1,
  };

  beforeAll(async () => {
    const allowGuard = {
      canActivate: jest.fn(() => true),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StatementsController],
      providers: [
        {
          provide: StatementsService,
          useValue: statementsServiceMock,
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

  it('POST /statements should create a statement', async () => {
    statementsServiceMock.create.mockResolvedValue({ id: 1, uuid: validUuid, ...createDto });
    await request(app.getHttpServer()).post('/statements').send(createDto).expect(201);
  });

  it('POST /statements should propagate service internal errors', async () => {
    statementsServiceMock.create.mockRejectedValue(new InternalServerErrorException('DB unavailable'));

    await request(app.getHttpServer()).post('/statements').send(createDto).expect(500);
  });

  it('GET /statements should return all statements', async () => {
    statementsServiceMock.findAll.mockResolvedValue([{ id: 1, uuid: validUuid, ...createDto }]);
    await request(app.getHttpServer())
      .get('/statements')
      .query({ offset: 0, count: 100 })
      .expect(200);
  });

  it('GET /statements should propagate service internal errors', async () => {
    statementsServiceMock.findAll.mockRejectedValue(new InternalServerErrorException('DB unavailable'));
    await request(app.getHttpServer())
      .get('/statements')
      .query({ offset: 0, count: 100 })
      .expect(500);
  });

  it('GET /statements/type should return all statements filtered by metric type', async () => {
    statementsServiceMock.findAllByType.mockResolvedValue([{ id: 1, uuid: validUuid, ...createDto }]);
    await request(app.getHttpServer())
      .get('/statements/type')
      .query({ type: 'TEMPERATURE', offset: 0, count: 100 })
      .expect(200);
  });

  it('GET /statements/type should propagate service internal errors', async () => {
    statementsServiceMock.findAllByType.mockRejectedValue(new InternalServerErrorException('DB unavailable'));
    await request(app.getHttpServer())
      .get('/statements/type')
      .query({ type: 'TEMPERATURE', offset: 0, count: 100 })
      .expect(500);
  });

  it('GET /statements/uuid should return 400 for invalid uuid', async () => {
    await request(app.getHttpServer()).get('/statements/uuid').query({ uuid: 'invalid' }).expect(400);
  });

  it('GET /statements/uuid should return one statement for valid uuid', async () => {
    statementsServiceMock.findOneByUuid.mockResolvedValue({ id: 1, uuid: validUuid, ...createDto });
    await request(app.getHttpServer()).get('/statements/uuid').query({ uuid: validUuid }).expect(200);
  });

  it('GET /statements/uuid should propagate service not found errors for valid uuid', async () => {
    statementsServiceMock.findOneByUuid.mockRejectedValue(new BadRequestException('Statement not found'));

    await request(app.getHttpServer()).get('/statements/uuid').query({ uuid: validUuid }).expect(400);
  });

  it('GET /statements/id should return 400 for invalid id', async () => {
    await request(app.getHttpServer()).get('/statements/id').query({ id: 'abc' }).expect(400);
  });

  it('GET /statements/id should return one statement for valid id', async () => {
    statementsServiceMock.findOneById.mockResolvedValue({ id: 1, uuid: validUuid, ...createDto });
    await request(app.getHttpServer()).get('/statements/id').query({ id: 1 }).expect(200);
  });

  it('PATCH /statements should return 400 for invalid uuid', async () => {
    await request(app.getHttpServer()).patch('/statements').query({ uuid: 'invalid' }).send({ temperature: 25 }).expect(400);
  });

  it('PATCH /statements should update one statement for valid uuid', async () => {
    statementsServiceMock.update.mockResolvedValue({ id: 1, uuid: validUuid, ...createDto, temperature: 25 });

    await request(app.getHttpServer())
      .patch('/statements')
      .query({ uuid: validUuid })
      .send({ temperature: 25 })
      .expect(200);
  });

  it('PATCH /statements should propagate service internal errors', async () => {
    statementsServiceMock.update.mockRejectedValue(new InternalServerErrorException('DB unavailable'));

    await request(app.getHttpServer()).patch('/statements').query({ uuid: validUuid }).send({ temperature: 25 }).expect(500);
  });

  it('DELETE /statements should return 400 for invalid uuid', async () => {
    await request(app.getHttpServer()).delete('/statements').query({ uuid: 'invalid' }).expect(400);
  });

  it('DELETE /statements should delete one statement for valid uuid', async () => {
    statementsServiceMock.remove.mockResolvedValue(undefined);
    await request(app.getHttpServer()).delete('/statements').query({ uuid: validUuid }).expect(204);
  });

  it('DELETE /statements should propagate service internal errors', async () => {
    statementsServiceMock.remove.mockRejectedValue(new InternalServerErrorException('DB unavailable'));

    await request(app.getHttpServer()).delete('/statements').query({ uuid: validUuid }).expect(500);
  });

  it('PATCH /statements/restore should return 400 for invalid uuid', async () => {
    await request(app.getHttpServer()).patch('/statements/restore').query({ uuid: 'invalid' }).expect(400);
  });

  it('PATCH /statements/restore should restore one statement for valid uuid', async () => {
    statementsServiceMock.restore.mockResolvedValue({ id: 1, uuid: validUuid, ...createDto });
    await request(app.getHttpServer()).patch('/statements/restore').query({ uuid: validUuid }).expect(200);
  });

  it('PATCH /statements/restore should propagate service internal errors', async () => {
    statementsServiceMock.restore.mockRejectedValue(new InternalServerErrorException('DB unavailable'));

    await request(app.getHttpServer()).patch('/statements/restore').query({ uuid: validUuid }).expect(500);
  });
});
