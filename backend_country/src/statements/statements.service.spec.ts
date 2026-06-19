import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { StatementsService } from './statements.service';
import { Statement } from './statement.entity';
import { WarehousesService } from '../warehouses/warehouses.service';
import { StatusesService } from '../statuses/statuses.service';
import { AlertsService } from '../alerts/alerts.service';

jest.mock('uuid', () => ({
  v4: jest.fn(() => '550e8400-e29b-41d4-a716-446655440000'),
}));

describe('StatementsService', () => {
  let service: StatementsService;
  let consoleErrorSpy: jest.SpyInstance;
  const validUuid = '550e8400-e29b-41d4-a716-446655440000';
  const repoMock = {
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    restore: jest.fn(),
  };
  const warehousesServiceMock = {
    findOneById: jest.fn(),
  };
  const alertsServiceMock = {
    create: jest.fn(),
  };
  const statusesServiceMock = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatementsService,
        {
          provide: getRepositoryToken(Statement),
          useValue: repoMock,
        },
        {
          provide: WarehousesService,
          useValue: warehousesServiceMock,
        },
        {
          provide: AlertsService,
          useValue: alertsServiceMock,
        },
        {
          provide: StatusesService,
          useValue: statusesServiceMock,
        },
      ],
    }).compile();

    service = module.get<StatementsService>(StatementsService);
    jest.clearAllMocks();
  });

  beforeAll(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should return all statements', async () => {
    repoMock.find.mockResolvedValue([{ id: 1, uuid: validUuid, temperature: 23.5, humidity: 60, id_warehouse: 1 }]);

    const result = await service.findAll();

    expect(result).toHaveLength(1);
    expect(repoMock.find).toHaveBeenCalledTimes(1);
  });

  it('should create a statement when payload is valid', async () => {
    warehousesServiceMock.findOneById.mockResolvedValue({
      id: 1,
      name: 'Warehouse A',
      farm: {
        id: 1,
        name: 'Farm A',
        country: {
          id: 1,
          name: 'Country A',
          temperature_ideal: 20,
          temperature_tolerance_degrees: 5,
          humidity_ideal: 60,
          humidity_tolerance_percents: 10,
        }
      },
      batches: []
    });
    repoMock.create.mockImplementation((value) => value);
    repoMock.save.mockImplementation(async (value) => ({ id: 1, ...value }));

    const result = await service.create({ temperature: 23.5, humidity: 65, id_warehouse: 1 });

    expect(result.id).toBe(1);
    expect(result.uuid).toBeDefined();
  });

  it('should throw for invalid temperature value', async () => {
    await expect(service.create({ temperature: NaN, humidity: 65, id_warehouse: 1 })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw for invalid humidity value', async () => {
    await expect(service.create({ temperature: 23.5, humidity: 150, id_warehouse: 1 })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw for invalid id_warehouse on create', async () => {
    await expect(service.create({ temperature: 23.5, humidity: 65, id_warehouse: 0 })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw when related warehouse is not found on create', async () => {
    warehousesServiceMock.findOneById.mockResolvedValue(null);

    await expect(service.create({ temperature: 23.5, humidity: 65, id_warehouse: 1 })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should wrap repository save errors on create', async () => {
    warehousesServiceMock.findOneById.mockResolvedValue({ id: 1, name: 'Warehouse A' });
    repoMock.create.mockImplementation((value) => value);
    repoMock.save.mockRejectedValue(new Error('db-error'));

    await expect(service.create({ temperature: 23.5, humidity: 65, id_warehouse: 1 })).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('should throw for invalid uuid in findOneByUuid', async () => {
    await expect(service.findOneByUuid('bad-uuid')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw when statement uuid is not found', async () => {
    repoMock.findOneBy.mockResolvedValue(null);

    await expect(service.findOneByUuid(validUuid)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should return one statement by uuid', async () => {
    repoMock.findOneBy.mockResolvedValue({ id: 1, uuid: validUuid, temperature: 23.5, humidity: 60, id_warehouse: 1 });

    const result = await service.findOneByUuid(validUuid);

    expect(result.uuid).toBe(validUuid);
  });

  it('should throw for invalid id in findOneById', async () => {
    await expect(service.findOneById(0)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw when statement id is not found', async () => {
    repoMock.findOneBy.mockResolvedValue(null);

    await expect(service.findOneById(1)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should return one statement by id', async () => {
    repoMock.findOneBy.mockResolvedValue({ id: 1, uuid: validUuid, temperature: 23.5, humidity: 60, id_warehouse: 1 });

    const result = await service.findOneById(1);

    expect(result.id).toBe(1);
  });

  it('should throw for invalid uuid on update', async () => {
    await expect(service.update('bad-uuid', { temperature: 24.2 })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw for invalid humidity on update', async () => {
    await expect(service.update(validUuid, { humidity: 150 })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw for invalid id_warehouse on update', async () => {
    await expect(service.update(validUuid, { id_warehouse: 0 })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw when related warehouse is not found on update', async () => {
    warehousesServiceMock.findOneById.mockResolvedValue(null);

    await expect(service.update(validUuid, { id_warehouse: 2 })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should update and return the statement', async () => {
    repoMock.findOneBy.mockResolvedValue({ id: 1, uuid: validUuid, temperature: 23.5, humidity: 60, id_warehouse: 1 });
    repoMock.update.mockResolvedValue(undefined);

    const result = await service.update(validUuid, { temperature: 24.2 });

    expect(repoMock.update).toHaveBeenCalledWith({ uuid: validUuid }, { temperature: 24.2 });
    expect(result.uuid).toBe(validUuid);
  });

  it('should wrap repository update errors', async () => {
    repoMock.findOneBy.mockResolvedValue({ id: 1, uuid: validUuid, temperature: 23.5, humidity: 60, id_warehouse: 1 });
    repoMock.update.mockRejectedValue(new Error('db-error'));

    await expect(service.update(validUuid, { temperature: 24.2 })).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('should throw for invalid uuid on remove', async () => {
    await expect(service.remove('bad-uuid')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should remove an existing statement', async () => {
    repoMock.findOneBy.mockResolvedValue({ id: 1, uuid: validUuid, temperature: 23.5, humidity: 60, id_warehouse: 1 });
    repoMock.softDelete.mockResolvedValue(undefined);

    await expect(service.remove(validUuid)).resolves.toBeUndefined();
    expect(repoMock.softDelete).toHaveBeenCalledWith({ uuid: validUuid });
  });

  it('should wrap repository softDelete errors', async () => {
    repoMock.findOneBy.mockResolvedValue({ id: 1, uuid: validUuid, temperature: 23.5, humidity: 60, id_warehouse: 1 });
    repoMock.softDelete.mockRejectedValue(new Error('db-error'));

    await expect(service.remove(validUuid)).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('should throw for invalid uuid on restore', async () => {
    await expect(service.restore('bad-uuid')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw when trying to restore an existing statement', async () => {
    repoMock.findOneBy.mockResolvedValue({ id: 1, uuid: validUuid, temperature: 23.5, humidity: 60 });
    await expect(service.restore(validUuid)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should restore and return statement when deleted entity exists', async () => {
    repoMock.findOneBy
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 1, uuid: validUuid, temperature: 23.5, humidity: 60, id_warehouse: 1 });
    repoMock.restore.mockResolvedValue(undefined);

    const result = await service.restore(validUuid);

    expect(repoMock.restore).toHaveBeenCalledWith({ uuid: validUuid });
    expect(result.uuid).toBe(validUuid);
  });

  it('should wrap repository restore errors', async () => {
    repoMock.findOneBy.mockResolvedValue(null);
    repoMock.restore.mockRejectedValue(new Error('db-error'));

    await expect(service.restore(validUuid)).rejects.toBeInstanceOf(InternalServerErrorException);
  });
});
