import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import request from 'supertest';
import { CountriesController } from './countries.controller';
import { CountriesService } from './countries.service';

jest.mock('uuid', () => ({
  v4: jest.fn(() => '550e8400-e29b-41d4-a716-446655440000'),
}));

describe('CountriesController', () => {
  let app: INestApplication;
  const validUuid = '550e8400-e29b-41d4-a716-446655440000';
  const countriesServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOneByUuid: jest.fn(),
    findOneById: jest.fn(),
    findOneByName: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    restore: jest.fn(),
  };

  const createDto = {
    name: 'Brazil',
    temperature_ideal: 24,
    temperature_tolerance_degrees: 3,
    humidity_ideal: 75,
    humidity_tolerance_percents: 10,
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CountriesController],
      providers: [
        {
          provide: CountriesService,
          useValue: countriesServiceMock,
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

  it('POST /countries should create a country', async () => {
    countriesServiceMock.create.mockResolvedValue({ id: 1, uuid: validUuid, ...createDto });

    await request(app.getHttpServer())
      .post('/countries')
      .send(createDto)
      .expect(201)
      .expect(({ body }) => {
        expect(body.uuid).toBe(validUuid);
      });

    expect(countriesServiceMock.create).toHaveBeenCalledWith(createDto);
  });

  it('POST /countries should propagate service internal errors', async () => {
    countriesServiceMock.create.mockRejectedValue(new InternalServerErrorException('DB unavailable'));

    await request(app.getHttpServer()).post('/countries').send(createDto).expect(500);
  });

  it('GET /countries should return all countries', async () => {
    countriesServiceMock.findAll.mockResolvedValue([{ id: 1, uuid: validUuid, ...createDto }]);

    await request(app.getHttpServer())
      .get('/countries')
      .expect(200)
      .expect(({ body }) => {
        expect(Array.isArray(body)).toBe(true);
        expect(body).toHaveLength(1);
      });
  });

  it('GET /countries should propagate service internal errors', async () => {
    countriesServiceMock.findAll.mockRejectedValue(new InternalServerErrorException('DB unavailable'));

    await request(app.getHttpServer()).get('/countries').expect(500);
  });

  it('GET /countries/uuid should return 400 for an invalid uuid', async () => {
    await request(app.getHttpServer()).get('/countries/uuid').query({ uuid: 'invalid' }).expect(400);
    expect(countriesServiceMock.findOneByUuid).not.toHaveBeenCalled();
  });

  it('GET /countries/uuid should return one country with a valid uuid', async () => {
    countriesServiceMock.findOneByUuid.mockResolvedValue({ id: 1, uuid: validUuid, ...createDto });

    await request(app.getHttpServer())
      .get('/countries/uuid')
      .query({ uuid: validUuid })
      .expect(200)
      .expect(({ body }) => {
        expect(body.uuid).toBe(validUuid);
      });
  });

  it('GET /countries/uuid should propagate service not found errors for valid uuid', async () => {
    countriesServiceMock.findOneByUuid.mockRejectedValue(new BadRequestException('Country not found'));

    await request(app.getHttpServer()).get('/countries/uuid').query({ uuid: validUuid }).expect(400);
  });

  it('GET /countries/id should return 400 for an invalid id', async () => {
    await request(app.getHttpServer()).get('/countries/id').query({ id: 'NaN' }).expect(400);
    expect(countriesServiceMock.findOneById).not.toHaveBeenCalled();
  });

  it('GET /countries/id should return one country with a valid id', async () => {
    countriesServiceMock.findOneById.mockResolvedValue({ id: 1, uuid: validUuid, ...createDto });

    await request(app.getHttpServer())
      .get('/countries/id')
      .query({ id: 1 })
      .expect(200)
      .expect(({ body }) => {
        expect(body.id).toBe(1);
      });
  });

  it('GET /countries/name should call service and return a country', async () => {
    countriesServiceMock.findOneByName.mockResolvedValue({ id: 1, uuid: validUuid, ...createDto });

    await request(app.getHttpServer())
      .get('/countries/name')
      .query({ name: 'Brazil' })
      .expect(200)
      .expect(({ body }) => {
        expect(body.name).toBe('Brazil');
      });
  });

  it('GET /countries/name should propagate service validation errors', async () => {
    countriesServiceMock.findOneByName.mockRejectedValue(new BadRequestException('Invalid name'));

    await request(app.getHttpServer()).get('/countries/name').query({ name: '' }).expect(400);
  });

  it('PATCH /countries should return 400 for an invalid uuid', async () => {
    await request(app.getHttpServer()).patch('/countries').query({ uuid: 'invalid' }).send({ name: 'BR' }).expect(400);
    expect(countriesServiceMock.update).not.toHaveBeenCalled();
  });

  it('PATCH /countries should update a country with a valid uuid', async () => {
    countriesServiceMock.update.mockResolvedValue({ id: 1, uuid: validUuid, ...createDto, name: 'Brasil' });

    await request(app.getHttpServer())
      .patch('/countries')
      .query({ uuid: validUuid })
      .send({ name: 'Brasil' })
      .expect(200)
      .expect(({ body }) => {
        expect(body.name).toBe('Brasil');
      });
  });

  it('PATCH /countries should propagate service internal errors', async () => {
    countriesServiceMock.update.mockRejectedValue(new InternalServerErrorException('DB unavailable'));

    await request(app.getHttpServer()).patch('/countries').query({ uuid: validUuid }).send({ name: 'Brasil' }).expect(500);
  });

  it('DELETE /countries should return 400 for an invalid uuid', async () => {
    await request(app.getHttpServer()).delete('/countries').query({ uuid: 'invalid' }).expect(400);
    expect(countriesServiceMock.remove).not.toHaveBeenCalled();
  });

  it('DELETE /countries should delete a country with a valid uuid', async () => {
    countriesServiceMock.remove.mockResolvedValue(undefined);

    await request(app.getHttpServer()).delete('/countries').query({ uuid: validUuid }).expect(204);
    expect(countriesServiceMock.remove).toHaveBeenCalledWith(validUuid);
  });

  it('DELETE /countries should propagate service internal errors', async () => {
    countriesServiceMock.remove.mockRejectedValue(new InternalServerErrorException('DB unavailable'));

    await request(app.getHttpServer()).delete('/countries').query({ uuid: validUuid }).expect(500);
  });

  it('PATCH /countries/restore should return 400 for an invalid uuid', async () => {
    await request(app.getHttpServer()).patch('/countries/restore').query({ uuid: 'invalid' }).expect(400);
    expect(countriesServiceMock.restore).not.toHaveBeenCalled();
  });

  it('PATCH /countries/restore should restore a country with a valid uuid', async () => {
    countriesServiceMock.restore.mockResolvedValue({ id: 1, uuid: validUuid, ...createDto });

    await request(app.getHttpServer())
      .patch('/countries/restore')
      .query({ uuid: validUuid })
      .expect(200)
      .expect(({ body }) => {
        expect(body.uuid).toBe(validUuid);
      });
  });

  it('PATCH /countries/restore should propagate service internal errors', async () => {
    countriesServiceMock.restore.mockRejectedValue(new InternalServerErrorException('DB unavailable'));

    await request(app.getHttpServer()).patch('/countries/restore').query({ uuid: validUuid }).expect(500);
  });
});
