import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { StatusesService } from './statuses.service';
import { Status } from './status.entity';
import { BatchesService } from '../batches/batches.service';

jest.mock('uuid', () => ({
  v4: jest.fn(() => '550e8400-e29b-41d4-a716-446655440000'),
}));

describe('StatusesService', () => {
  let service: StatusesService;
  let consoleErrorSpy: jest.SpyInstance;
  const validUuid = '550e8400-e29b-41d4-a716-446655440000';
  const repoMock = {
    findOneBy: jest.fn(),
    findBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    restore: jest.fn(),
  };
  const batchesServiceMock = {
    findOneById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatusesService,
        {
          provide: getRepositoryToken(Status),
          useValue: repoMock,
        },
        {
          provide: BatchesService,
          useValue: batchesServiceMock,
        },
      ],
    }).compile();

    service = module.get<StatusesService>(StatusesService);
    jest.clearAllMocks();
  });

  beforeAll(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should return all statuses', async () => {
    repoMock.find.mockResolvedValue([{ id: 1, uuid: validUuid, value: 'OK', id_batch: 1 }]);

    const result = await service.findAll();

    expect(result).toHaveLength(1);
    expect(repoMock.find).toHaveBeenCalledTimes(1);
  });

  it('should create a status when payload is valid', async () => {
    batchesServiceMock.findOneById.mockResolvedValue({ id: 1 });
    repoMock.create.mockImplementation((value) => value);
    repoMock.save.mockImplementation(async (value) => ({ id: 1, ...value }));

    const result = await service.create({ value: 'OK', id_batch: 1 });

    expect(result.id).toBe(1);
    expect(result.uuid).toBeDefined();
  });

  it('should throw for unsupported status value', async () => {
    await expect(service.create({ value: 'BAD' as never, id_batch: 1 })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw for invalid id_batch on create', async () => {
    await expect(service.create({ value: 'OK', id_batch: 0 })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw when related batch is not found on create', async () => {
    batchesServiceMock.findOneById.mockResolvedValue(null);

    await expect(service.create({ value: 'OK', id_batch: 1 })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should wrap repository save errors on create', async () => {
    batchesServiceMock.findOneById.mockResolvedValue({ id: 1 });
    repoMock.create.mockImplementation((value) => value);
    repoMock.save.mockRejectedValue(new Error('db-error'));

    await expect(service.create({ value: 'OK', id_batch: 1 })).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('should return statuses for a valid value', async () => {
    repoMock.findBy.mockResolvedValue([{ id: 1, uuid: validUuid, value: 'OK', id_batch: 1 }]);

    const result = await service.findAllByValue('OK');

    expect(result).toHaveLength(1);
    expect(repoMock.findBy).toHaveBeenCalledWith({ value: 'OK' });
  });

  it('should throw for invalid value in findAllByValue', async () => {
    await expect(service.findAllByValue('UNKNOWN')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw for invalid uuid in findOneByUuid', async () => {
    await expect(service.findOneByUuid('bad-uuid')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw when status uuid is not found', async () => {
    repoMock.findOneBy.mockResolvedValue(null);

    await expect(service.findOneByUuid(validUuid)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should return one status by uuid', async () => {
    repoMock.findOneBy.mockResolvedValue({ id: 1, uuid: validUuid, value: 'OK', id_batch: 1 });

    const result = await service.findOneByUuid(validUuid);

    expect(result.uuid).toBe(validUuid);
  });

  it('should throw for invalid id in findOneById', async () => {
    await expect(service.findOneById(0)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw when status id is not found', async () => {
    repoMock.findOneBy.mockResolvedValue(null);

    await expect(service.findOneById(1)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should return one status by id', async () => {
    repoMock.findOneBy.mockResolvedValue({ id: 1, uuid: validUuid, value: 'OK', id_batch: 1 });

    const result = await service.findOneById(1);

    expect(result.id).toBe(1);
  });

  it('should throw for invalid uuid on update', async () => {
    await expect(service.update('bad-uuid', { value: 'ALERT' })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw for unsupported value on update', async () => {
    await expect(service.update(validUuid, { value: 'BAD' as never })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw for invalid id_batch on update', async () => {
    await expect(service.update(validUuid, { id_batch: 0 })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw when related batch is not found on update', async () => {
    batchesServiceMock.findOneById.mockResolvedValue(null);

    await expect(service.update(validUuid, { id_batch: 2 })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should update and return status', async () => {
    repoMock.findOneBy.mockResolvedValue({ id: 1, uuid: validUuid, value: 'OK', id_batch: 1 });
    repoMock.update.mockResolvedValue(undefined);

    const result = await service.update(validUuid, { value: 'ALERT' });

    expect(repoMock.update).toHaveBeenCalledWith({ uuid: validUuid }, { value: 'ALERT' });
    expect(result.uuid).toBe(validUuid);
  });

  it('should wrap repository update errors', async () => {
    repoMock.findOneBy.mockResolvedValue({ id: 1, uuid: validUuid, value: 'OK', id_batch: 1 });
    repoMock.update.mockRejectedValue(new Error('db-error'));

    await expect(service.update(validUuid, { value: 'ALERT' })).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('should throw for invalid uuid on remove', async () => {
    await expect(service.remove('bad-uuid')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should remove an existing status', async () => {
    repoMock.findOneBy.mockResolvedValue({ id: 1, uuid: validUuid, value: 'OK', id_batch: 1 });
    repoMock.softDelete.mockResolvedValue(undefined);

    await expect(service.remove(validUuid)).resolves.toBeUndefined();
    expect(repoMock.softDelete).toHaveBeenCalledWith({ uuid: validUuid });
  });

  it('should wrap repository softDelete errors', async () => {
    repoMock.findOneBy.mockResolvedValue({ id: 1, uuid: validUuid, value: 'OK', id_batch: 1 });
    repoMock.softDelete.mockRejectedValue(new Error('db-error'));

    await expect(service.remove(validUuid)).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('should throw for invalid uuid on restore', async () => {
    await expect(service.restore('bad-uuid')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw when trying to restore an existing status', async () => {
    repoMock.findOneBy.mockResolvedValue({ id: 1, uuid: validUuid, value: 'OK' });
    await expect(service.restore(validUuid)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should restore and return status when deleted entity exists', async () => {
    repoMock.findOneBy.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 1, uuid: validUuid, value: 'OK', id_batch: 1 });
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
