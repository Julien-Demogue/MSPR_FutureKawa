import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { FarmsService } from './farms.service';
import { Farm } from './farm.entity';
import { CountriesService } from '../countries/countries.service';

jest.mock('uuid', () => ({
  v4: jest.fn(() => '550e8400-e29b-41d4-a716-446655440000'),
}));

describe('FarmsService', () => {
  let service: FarmsService;
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
  const countriesServiceMock = {
    findOneById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FarmsService,
        {
          provide: getRepositoryToken(Farm),
          useValue: repoMock,
        },
        {
          provide: CountriesService,
          useValue: countriesServiceMock,
        },
      ],
    }).compile();

    service = module.get<FarmsService>(FarmsService);
    jest.clearAllMocks();
  });

  beforeAll(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should return all farms', async () => {
    repoMock.find.mockResolvedValue([{ id: 1, uuid: validUuid, name: 'Farm A', id_country: 1 }]);

    const result = await service.findAll();

    expect(result).toHaveLength(1);
    expect(repoMock.find).toHaveBeenCalledTimes(1);
  });

  it('should create a farm when payload is valid', async () => {
    const payload = {
      name: 'Farm A',
      id_country: 1,
    };

    countriesServiceMock.findOneById.mockResolvedValue({ id: 1, name: 'Brasil' });
    repoMock.create.mockImplementation((value) => value);
    repoMock.save.mockImplementation(async (value) => ({ id: 1, ...value }));

    const result = await service.create(payload);

    expect(result.id).toBe(1);
    expect(result.uuid).toBeDefined();
  });

  it('should throw for invalid name on create', async () => {
    await expect(service.create({ name: '', id_country: 1 })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw for invalid id_country', async () => {
    await expect(service.create({ name: 'Farm A', id_country: 0 })).rejects.toBeInstanceOf(BadRequestException);
    expect(countriesServiceMock.findOneById).not.toHaveBeenCalled();
  });

  it('should throw when related country is not found on create', async () => {
    countriesServiceMock.findOneById.mockResolvedValue(null);

    await expect(service.create({ name: 'Farm A', id_country: 1 })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should wrap repository save errors on create', async () => {
    countriesServiceMock.findOneById.mockResolvedValue({ id: 1, name: 'Brasil' });
    repoMock.create.mockImplementation((value) => value);
    repoMock.save.mockRejectedValue(new Error('db-error'));

    await expect(service.create({ name: 'Farm A', id_country: 1 })).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('should throw for invalid uuid in findOneByUuid', async () => {
    await expect(service.findOneByUuid('bad-uuid')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw when farm uuid is not found', async () => {
    repoMock.findOneBy.mockResolvedValue(null);

    await expect(service.findOneByUuid(validUuid)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should return one farm by uuid', async () => {
    repoMock.findOneBy.mockResolvedValue({ id: 1, uuid: validUuid, name: 'Farm A', id_country: 1 });

    const result = await service.findOneByUuid(validUuid);

    expect(result.uuid).toBe(validUuid);
  });

  it('should throw for invalid id in findOneById', async () => {
    await expect(service.findOneById(0)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw when farm id is not found', async () => {
    repoMock.findOneBy.mockResolvedValue(null);

    await expect(service.findOneById(1)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should return one farm by id', async () => {
    repoMock.findOneBy.mockResolvedValue({ id: 1, uuid: validUuid, name: 'Farm A', id_country: 1 });

    const result = await service.findOneById(1);

    expect(result.id).toBe(1);
  });

  it('should throw for invalid uuid on update', async () => {
    await expect(service.update('bad-uuid', { name: 'Farm B' })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw for invalid id_country on update', async () => {
    await expect(service.update(validUuid, { id_country: 0 })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw when related country is not found on update', async () => {
    countriesServiceMock.findOneById.mockResolvedValue(null);

    await expect(service.update(validUuid, { id_country: 2 })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should update and return the farm', async () => {
    repoMock.findOneBy.mockResolvedValue({ id: 1, uuid: validUuid, name: 'Farm A', id_country: 1 });
    repoMock.update.mockResolvedValue(undefined);

    const result = await service.update(validUuid, { name: 'Farm B' });

    expect(repoMock.update).toHaveBeenCalledWith({ uuid: validUuid }, { name: 'Farm B' });
    expect(result.uuid).toBe(validUuid);
  });

  it('should wrap repository update errors', async () => {
    repoMock.findOneBy.mockResolvedValue({ id: 1, uuid: validUuid, name: 'Farm A', id_country: 1 });
    repoMock.update.mockRejectedValue(new Error('db-error'));

    await expect(service.update(validUuid, { name: 'Farm B' })).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('should throw for invalid uuid on remove', async () => {
    await expect(service.remove('bad-uuid')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should remove an existing farm', async () => {
    repoMock.findOneBy.mockResolvedValue({ id: 1, uuid: validUuid, name: 'Farm A', id_country: 1 });
    repoMock.softDelete.mockResolvedValue(undefined);

    await expect(service.remove(validUuid)).resolves.toBeUndefined();
    expect(repoMock.softDelete).toHaveBeenCalledWith({ uuid: validUuid });
  });

  it('should wrap repository softDelete errors', async () => {
    repoMock.findOneBy.mockResolvedValue({ id: 1, uuid: validUuid, name: 'Farm A', id_country: 1 });
    repoMock.softDelete.mockRejectedValue(new Error('db-error'));

    await expect(service.remove(validUuid)).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('should throw for invalid uuid on restore', async () => {
    await expect(service.restore('bad-uuid')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw when trying to restore an existing farm', async () => {
    repoMock.findOneBy.mockResolvedValue({ id: 1, uuid: validUuid, name: 'Farm A' });

    await expect(service.restore(validUuid)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should restore and return farm when deleted entity exists', async () => {
    repoMock.findOneBy.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 1, uuid: validUuid, name: 'Farm A', id_country: 1 });
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
