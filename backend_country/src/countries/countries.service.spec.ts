import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { CountriesService } from './countries.service';
import { Country } from './country.entity';

jest.mock('uuid', () => ({
  v4: jest.fn(() => '550e8400-e29b-41d4-a716-446655440000'),
}));

describe('CountriesService', () => {
  let service: CountriesService;
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CountriesService,
        {
          provide: getRepositoryToken(Country),
          useValue: repoMock,
        },
      ],
    }).compile();

    service = module.get<CountriesService>(CountriesService);
    jest.clearAllMocks();
  });

  beforeAll(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should return all countries', async () => {
    repoMock.find.mockResolvedValue([{ id: 1, uuid: validUuid, name: 'Brazil' }]);

    const result = await service.findAll();

    expect(result).toHaveLength(1);
    expect(repoMock.find).toHaveBeenCalledTimes(1);
  });

  it('should create a country when payload is valid', async () => {
    const payload = {
      name: 'Brazil',
      temperature_ideal: 24,
      temperature_tolerance_degrees: 3,
      humidity_ideal: 70,
      humidity_tolerance_percents: 10,
    };

    repoMock.findOneBy.mockResolvedValue(null);
    repoMock.create.mockImplementation((value) => value);
    repoMock.save.mockImplementation(async (value) => ({ id: 1, ...value }));

    const result = await service.create(payload);

    expect(result.id).toBe(1);
    expect(result.name).toBe('Brazil');
    expect(result.uuid).toBeDefined();
  });

  it('should throw for invalid country name on create', async () => {
    await expect(
      service.create({
        name: '',
        temperature_ideal: 24,
        temperature_tolerance_degrees: 3,
        humidity_ideal: 70,
        humidity_tolerance_percents: 10,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw for duplicate country name', async () => {
    repoMock.findOneBy.mockResolvedValue({ id: 5, name: 'Brazil' });

    await expect(
      service.create({
        name: 'Brazil',
        temperature_ideal: 24,
        temperature_tolerance_degrees: 3,
        humidity_ideal: 70,
        humidity_tolerance_percents: 10,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('should wrap repository save errors on create', async () => {
    repoMock.findOneBy.mockResolvedValue(null);
    repoMock.create.mockImplementation((value) => value);
    repoMock.save.mockRejectedValue(new Error('db-error'));

    await expect(
      service.create({
        name: 'Brazil',
        temperature_ideal: 24,
        temperature_tolerance_degrees: 3,
        humidity_ideal: 70,
        humidity_tolerance_percents: 10,
      }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('should throw for invalid uuid in findOneByUuid', async () => {
    await expect(service.findOneByUuid('bad-uuid')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw when country uuid is not found', async () => {
    repoMock.findOneBy.mockResolvedValue(null);

    await expect(service.findOneByUuid(validUuid)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should return one country by uuid', async () => {
    repoMock.findOneBy.mockResolvedValue({ id: 1, uuid: validUuid, name: 'Brazil' });

    const result = await service.findOneByUuid(validUuid);

    expect(result.uuid).toBe(validUuid);
  });

  it('should throw for invalid id in findOneById', async () => {
    await expect(service.findOneById(0)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw when country id is not found', async () => {
    repoMock.findOneBy.mockResolvedValue(null);

    await expect(service.findOneById(1)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should return one country by id', async () => {
    repoMock.findOneBy.mockResolvedValue({ id: 1, uuid: validUuid, name: 'Brazil' });

    const result = await service.findOneById(1);

    expect(result.id).toBe(1);
  });

  it('should throw for invalid name in findOneByName', async () => {
    await expect(service.findOneByName('')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw when country name is not found', async () => {
    repoMock.findOneBy.mockResolvedValue(null);

    await expect(service.findOneByName('Brazil')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should return one country by name', async () => {
    repoMock.findOneBy.mockResolvedValue({ id: 1, uuid: validUuid, name: 'Brazil' });

    const result = await service.findOneByName('Brazil');

    expect(result.name).toBe('Brazil');
  });

  it('should throw for invalid uuid on update', async () => {
    await expect(service.update('bad-uuid', { name: 'Brasil' })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should update and return the country', async () => {
    repoMock.findOneBy.mockResolvedValue({ id: 1, uuid: validUuid, name: 'Brazil' });
    repoMock.update.mockResolvedValue(undefined);

    const result = await service.update(validUuid, { name: 'Brasil' });

    expect(repoMock.update).toHaveBeenCalledWith({ uuid: validUuid }, { name: 'Brasil' });
    expect(result.uuid).toBe(validUuid);
  });

  it('should wrap repository update errors', async () => {
    repoMock.findOneBy.mockResolvedValue({ id: 1, uuid: validUuid, name: 'Brazil' });
    repoMock.update.mockRejectedValue(new Error('db-error'));

    await expect(service.update(validUuid, { name: 'Brasil' })).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('should throw for invalid uuid on remove', async () => {
    await expect(service.remove('bad-uuid')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should remove an existing country', async () => {
    repoMock.findOneBy.mockResolvedValue({ id: 1, uuid: validUuid, name: 'Brazil' });
    repoMock.softDelete.mockResolvedValue(undefined);

    await expect(service.remove(validUuid)).resolves.toBeUndefined();
    expect(repoMock.softDelete).toHaveBeenCalledWith({ uuid: validUuid });
  });

  it('should wrap repository softDelete errors', async () => {
    repoMock.findOneBy.mockResolvedValue({ id: 1, uuid: validUuid, name: 'Brazil' });
    repoMock.softDelete.mockRejectedValue(new Error('db-error'));

    await expect(service.remove(validUuid)).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('should throw for invalid uuid on restore', async () => {
    await expect(service.restore('bad-uuid')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should throw when trying to restore an existing country', async () => {
    repoMock.findOneBy.mockResolvedValue({ id: 1, uuid: validUuid, name: 'Brazil' });

    await expect(service.restore(validUuid)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should restore and return country when deleted entity exists', async () => {
    repoMock.findOneBy.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 1, uuid: validUuid, name: 'Brazil' });
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
