import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { Alert } from './alert.entity';
import { StatusesService } from '../statuses/statuses.service';
import { StatementsService } from '../statements/statements.service';

jest.mock('uuid', () => ({
  v4: jest.fn(() => '550e8400-e29b-41d4-a716-446655440000'),
}));

describe('AlertsService', () => {
  let service: AlertsService;
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
  const statusesServiceMock = {
    findOneById: jest.fn(),
  };
  const statementsServiceMock = {
    findOneById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertsService,
        {
          provide: getRepositoryToken(Alert),
          useValue: repoMock,
        },
        {
          provide: StatusesService,
          useValue: statusesServiceMock,
        },
        {
          provide: StatementsService,
          useValue: statementsServiceMock,
        },
      ],
    }).compile();

    service = module.get<AlertsService>(AlertsService);
    jest.clearAllMocks();
  });

  beforeAll(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should return all alerts', async () => {
    repoMock.find.mockResolvedValue([{ id: 1, uuid: validUuid, value: 'Humidity drift', id_status: 1, id_statement: 1 }]);

    const result = await service.findAll();

    expect(result).toHaveLength(1);
    expect(repoMock.find).toHaveBeenCalledTimes(1);
  });

  it('should create an alert when payload is valid', async () => {
    const payload = {
      value: 'Humidity drift',
      id_status: 1,
      id_statement: 1,
    };

    statusesServiceMock.findOneById.mockResolvedValue({ id: 1, value: 'ALERT' });
    statementsServiceMock.findOneById.mockResolvedValue({ id: 1, temperature: 26 });
    repoMock.create.mockImplementation((value) => value);
    repoMock.save.mockImplementation(async (value) => ({ id: 1, ...value }));

    const result = await service.create(payload);

    expect(result.id).toBe(1);
    expect(result.uuid).toBeDefined();
  });

  it('should throw for invalid alert value', async () => {
    await expect(service.create({ value: '', id_status: 1, id_statement: 1 })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw for invalid id_statement on create', async () => {
    await expect(service.create({ value: 'Humidity drift', id_status: 1, id_statement: 0 })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw for invalid id_status on create', async () => {
    await expect(service.create({ value: 'Humidity drift', id_status: 0, id_statement: 1 })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw when related statement is not found on create', async () => {
    statementsServiceMock.findOneById.mockResolvedValue(null);

    await expect(service.create({ value: 'Humidity drift', id_status: 1, id_statement: 1 })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw when related status is not found on create', async () => {
    statementsServiceMock.findOneById.mockResolvedValue({ id: 1, temperature: 26 });
    statusesServiceMock.findOneById.mockResolvedValue(null);

    await expect(service.create({ value: 'Humidity drift', id_status: 1, id_statement: 1 })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should wrap repository save errors on create', async () => {
    statementsServiceMock.findOneById.mockResolvedValue({ id: 1, temperature: 26 });
    statusesServiceMock.findOneById.mockResolvedValue({ id: 1, value: 'ALERT' });
    repoMock.create.mockImplementation((value) => value);
    repoMock.save.mockRejectedValue(new Error('db-error'));

    await expect(service.create({ value: 'Humidity drift', id_status: 1, id_statement: 1 })).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('should throw for invalid uuid in findOneByUuid', async () => {
    await expect(service.findOneByUuid('bad-uuid')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw when alert uuid is not found', async () => {
    repoMock.findOneBy.mockResolvedValue(null);

    await expect(service.findOneByUuid(validUuid)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should return one alert by uuid', async () => {
    repoMock.findOneBy.mockResolvedValue({ id: 1, uuid: validUuid, value: 'Humidity drift', id_status: 1, id_statement: 1 });

    const result = await service.findOneByUuid(validUuid);

    expect(result.uuid).toBe(validUuid);
  });

  it('should throw for invalid id in findOneById', async () => {
    await expect(service.findOneById(0)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw when alert id is not found', async () => {
    repoMock.findOneBy.mockResolvedValue(null);

    await expect(service.findOneById(1)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should return one alert by id', async () => {
    repoMock.findOneBy.mockResolvedValue({ id: 1, uuid: validUuid, value: 'Humidity drift', id_status: 1, id_statement: 1 });

    const result = await service.findOneById(1);

    expect(result.id).toBe(1);
  });

  it('should throw for invalid uuid on update', async () => {
    await expect(service.update('bad-uuid', { value: 'Temp drift' })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw for invalid id_statement on update', async () => {
    await expect(service.update(validUuid, { id_statement: 0 })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw for invalid id_status on update', async () => {
    await expect(service.update(validUuid, { id_status: 0 })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw when related statement is not found on update', async () => {
    statementsServiceMock.findOneById.mockResolvedValue(null);

    await expect(service.update(validUuid, { id_statement: 2 })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw when related status is not found on update', async () => {
    statusesServiceMock.findOneById.mockResolvedValue(null);

    await expect(service.update(validUuid, { id_status: 2 })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should update and return the alert', async () => {
    repoMock.findOneBy.mockResolvedValue({ id: 1, uuid: validUuid, value: 'Humidity drift', id_status: 1, id_statement: 1 });
    repoMock.update.mockResolvedValue(undefined);

    const result = await service.update(validUuid, { value: 'Temp drift' });

    expect(repoMock.update).toHaveBeenCalledWith({ uuid: validUuid }, { value: 'Temp drift' });
    expect(result.uuid).toBe(validUuid);
  });

  it('should wrap repository update errors', async () => {
    repoMock.findOneBy.mockResolvedValue({ id: 1, uuid: validUuid, value: 'Humidity drift', id_status: 1, id_statement: 1 });
    repoMock.update.mockRejectedValue(new Error('db-error'));

    await expect(service.update(validUuid, { value: 'Temp drift' })).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('should throw for invalid uuid on remove', async () => {
    await expect(service.remove('bad-uuid')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should remove an existing alert', async () => {
    repoMock.findOneBy.mockResolvedValue({ id: 1, uuid: validUuid, value: 'Humidity drift', id_status: 1, id_statement: 1 });
    repoMock.softDelete.mockResolvedValue(undefined);

    await expect(service.remove(validUuid)).resolves.toBeUndefined();
    expect(repoMock.softDelete).toHaveBeenCalledWith({ uuid: validUuid });
  });

  it('should wrap repository softDelete errors', async () => {
    repoMock.findOneBy.mockResolvedValue({ id: 1, uuid: validUuid, value: 'Humidity drift', id_status: 1, id_statement: 1 });
    repoMock.softDelete.mockRejectedValue(new Error('db-error'));

    await expect(service.remove(validUuid)).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('should throw for invalid uuid on restore', async () => {
    await expect(service.restore('bad-uuid')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw when trying to restore an existing alert', async () => {
    repoMock.findOneBy.mockResolvedValue({ id: 1, uuid: validUuid, value: 'Humidity drift' });
    await expect(service.restore(validUuid)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should restore and return alert when deleted entity exists', async () => {
    repoMock.findOneBy
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 1, uuid: validUuid, value: 'Humidity drift', id_status: 1, id_statement: 1 });
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
