import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import request from 'supertest';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
import { ServiceAuthGuard } from '../utils/guards/service-auth.guard';

jest.mock('uuid', () => ({
  v4: jest.fn(() => '550e8400-e29b-41d4-a716-446655440000'),
}));

describe('AlertsController', () => {
  let app: INestApplication;
  const validUuid = '550e8400-e29b-41d4-a716-446655440000';
  const alertsServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOneByUuid: jest.fn(),
    findOneById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    restore: jest.fn(),
  };

  const createDto = {
    value: 'Humidity drift',
    id_status: 1,
    id_statement: 1,
  };

  beforeAll(async () => {
    const allowGuard = {
      canActivate: jest.fn(() => true),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AlertsController],
      providers: [
        {
          provide: AlertsService,
          useValue: alertsServiceMock,
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

  it('POST /alerts should create an alert', async () => {
    alertsServiceMock.create.mockResolvedValue({ id: 1, uuid: validUuid, ...createDto });
    await request(app.getHttpServer()).post('/alerts').send(createDto).expect(201);
  });

  it('POST /alerts should propagate service internal errors', async () => {
    alertsServiceMock.create.mockRejectedValue(new InternalServerErrorException('DB unavailable'));

    await request(app.getHttpServer()).post('/alerts').send(createDto).expect(500);
  });

  it('GET /alerts should return all alerts', async () => {
    alertsServiceMock.findAll.mockResolvedValue([{ id: 1, uuid: validUuid, ...createDto }]);
    await request(app.getHttpServer()).get('/alerts').expect(200);
  });

  it('GET /alerts should propagate service internal errors', async () => {
    alertsServiceMock.findAll.mockRejectedValue(new InternalServerErrorException('DB unavailable'));

    await request(app.getHttpServer()).get('/alerts').expect(500);
  });

  it('GET /alerts/uuid should return 400 for invalid uuid', async () => {
    await request(app.getHttpServer()).get('/alerts/uuid').query({ uuid: 'invalid' }).expect(400);
  });

  it('GET /alerts/uuid should return one alert for valid uuid', async () => {
    alertsServiceMock.findOneByUuid.mockResolvedValue({ id: 1, uuid: validUuid, ...createDto });
    await request(app.getHttpServer()).get('/alerts/uuid').query({ uuid: validUuid }).expect(200);
  });

  it('GET /alerts/uuid should propagate service not found errors for valid uuid', async () => {
    alertsServiceMock.findOneByUuid.mockRejectedValue(new BadRequestException('Alert not found'));

    await request(app.getHttpServer()).get('/alerts/uuid').query({ uuid: validUuid }).expect(400);
  });

  it('GET /alerts/id should return 400 for invalid id', async () => {
    await request(app.getHttpServer()).get('/alerts/id').query({ id: 'bad' }).expect(400);
  });

  it('GET /alerts/id should return one alert for valid id', async () => {
    alertsServiceMock.findOneById.mockResolvedValue({ id: 1, uuid: validUuid, ...createDto });
    await request(app.getHttpServer()).get('/alerts/id').query({ id: 1 }).expect(200);
  });

  it('PATCH /alerts should return 400 for invalid uuid', async () => {
    await request(app.getHttpServer()).patch('/alerts').query({ uuid: 'invalid' }).send({ value: 'x' }).expect(400);
  });

  it('PATCH /alerts should update one alert for valid uuid', async () => {
    alertsServiceMock.update.mockResolvedValue({ id: 1, uuid: validUuid, ...createDto, value: 'Temp drift' });

    await request(app.getHttpServer())
      .patch('/alerts')
      .query({ uuid: validUuid })
      .send({ value: 'Temp drift' })
      .expect(200);
  });

  it('PATCH /alerts should propagate service internal errors', async () => {
    alertsServiceMock.update.mockRejectedValue(new InternalServerErrorException('DB unavailable'));

    await request(app.getHttpServer()).patch('/alerts').query({ uuid: validUuid }).send({ value: 'Temp drift' }).expect(500);
  });

  it('DELETE /alerts should return 400 for invalid uuid', async () => {
    await request(app.getHttpServer()).delete('/alerts').query({ uuid: 'invalid' }).expect(400);
  });

  it('DELETE /alerts should delete one alert for valid uuid', async () => {
    alertsServiceMock.remove.mockResolvedValue(undefined);
    await request(app.getHttpServer()).delete('/alerts').query({ uuid: validUuid }).expect(204);
  });

  it('DELETE /alerts should propagate service internal errors', async () => {
    alertsServiceMock.remove.mockRejectedValue(new InternalServerErrorException('DB unavailable'));

    await request(app.getHttpServer()).delete('/alerts').query({ uuid: validUuid }).expect(500);
  });

  it('PATCH /alerts/restore should return 400 for invalid uuid', async () => {
    await request(app.getHttpServer()).patch('/alerts/restore').query({ uuid: 'invalid' }).expect(400);
  });

  it('PATCH /alerts/restore should restore one alert for valid uuid', async () => {
    alertsServiceMock.restore.mockResolvedValue({ id: 1, uuid: validUuid, ...createDto });
    await request(app.getHttpServer()).patch('/alerts/restore').query({ uuid: validUuid }).expect(200);
  });

  it('PATCH /alerts/restore should propagate service internal errors', async () => {
    alertsServiceMock.restore.mockRejectedValue(new InternalServerErrorException('DB unavailable'));

    await request(app.getHttpServer()).patch('/alerts/restore').query({ uuid: validUuid }).expect(500);
  });
});
