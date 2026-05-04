import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { RolesService } from './roles.service';
import { Role } from './role.entity';

jest.mock('uuid', () => ({
    v4: jest.fn(() => '550e8400-e29b-41d4-a716-446655440000'),
}));

describe('RolesService', () => {
    let service: RolesService;
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
                RolesService,
                {
                    provide: getRepositoryToken(Role),
                    useValue: repoMock,
                },
            ],
        }).compile();

        service = module.get<RolesService>(RolesService);
        jest.clearAllMocks();
    });

    beforeAll(() => {
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    afterAll(() => {
        consoleErrorSpy.mockRestore();
    });

    it('should return all roles', async () => {
        repoMock.find.mockResolvedValue([{ id: 1, uuid: validUuid, label: 'Admin' }]);

        const result = await service.findAll();

        expect(result).toHaveLength(1);
        expect(repoMock.find).toHaveBeenCalledTimes(1);
    });

    it('should create a role when payload is valid', async () => {
        repoMock.findOneBy.mockResolvedValue(null);
        repoMock.create.mockImplementation((value) => value);
        repoMock.save.mockImplementation(async (value) => ({ id: 1, ...value }));

        const result = await service.create({ label: 'Admin' });

        expect(result.id).toBe(1);
        expect(result.uuid).toBeDefined();
        expect(repoMock.create).toHaveBeenCalledWith({ label: 'Admin', uuid: validUuid });
    });

    it('should throw for invalid label on create', async () => {
        await expect(service.create({ label: '' })).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw for duplicate label on create', async () => {
        repoMock.findOneBy.mockResolvedValue({ id: 1, label: 'Admin' });

        await expect(service.create({ label: 'Admin' })).rejects.toBeInstanceOf(ConflictException);
    });

    it('should wrap repository save errors on create', async () => {
        repoMock.findOneBy.mockResolvedValue(null);
        repoMock.create.mockImplementation((value) => value);
        repoMock.save.mockRejectedValue(new Error('db-error'));

        await expect(service.create({ label: 'Admin' })).rejects.toBeInstanceOf(InternalServerErrorException);
    });

    it('should throw for invalid uuid in findOneByUuid', async () => {
        await expect(service.findOneByUuid('bad-uuid')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw when role uuid is not found', async () => {
        repoMock.findOneBy.mockResolvedValue(null);

        await expect(service.findOneByUuid(validUuid)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should return one role by uuid', async () => {
        repoMock.findOneBy.mockResolvedValue({ id: 1, uuid: validUuid, label: 'Admin' });

        const result = await service.findOneByUuid(validUuid);

        expect(result.uuid).toBe(validUuid);
    });

    it('should throw for invalid id in findOneById', async () => {
        await expect(service.findOneById(0)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw when role id is not found', async () => {
        repoMock.findOneBy.mockResolvedValue(null);

        await expect(service.findOneById(1)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should return one role by id', async () => {
        repoMock.findOneBy.mockResolvedValue({ id: 1, uuid: validUuid, label: 'Admin' });

        const result = await service.findOneById(1);

        expect(result.id).toBe(1);
    });

    it('should throw for invalid label in findOneByLabel', async () => {
        await expect(service.findOneByLabel('')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw when role label is not found', async () => {
        repoMock.findOneBy.mockResolvedValue(null);

        await expect(service.findOneByLabel('Admin')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should return one role by label', async () => {
        repoMock.findOneBy.mockResolvedValue({ id: 1, uuid: validUuid, label: 'Admin' });

        const result = await service.findOneByLabel('Admin');

        expect(result.label).toBe('Admin');
    });

    it('should throw for invalid uuid on update', async () => {
        await expect(service.update('bad-uuid', { label: 'Manager' })).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw for invalid label on update', async () => {
        await expect(service.update(validUuid, { label: '' })).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw when trying to update a missing role', async () => {
        repoMock.findOneBy.mockResolvedValueOnce(null);

        await expect(service.update(validUuid, { label: 'Manager' })).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw for duplicate label on update', async () => {
        repoMock.findOneBy.mockResolvedValueOnce({ id: 1, uuid: validUuid, label: 'Admin' });
        repoMock.findOneBy.mockResolvedValueOnce({ id: 2, uuid: 'other-uuid', label: 'Manager' });

        await expect(service.update(validUuid, { label: 'Manager' })).rejects.toBeInstanceOf(ConflictException);
    });

    it('should update and return the role', async () => {
        repoMock.findOneBy.mockResolvedValueOnce({ id: 1, uuid: validUuid, label: 'Admin' });
        repoMock.findOneBy.mockResolvedValueOnce(null);
        repoMock.update.mockResolvedValue(undefined);
        repoMock.findOneBy.mockResolvedValueOnce({ id: 1, uuid: validUuid, label: 'Manager' });

        const result = await service.update(validUuid, { label: 'Manager' });

        expect(repoMock.update).toHaveBeenCalledWith({ uuid: validUuid }, { label: 'Manager' });
        expect(result.uuid).toBe(validUuid);
    });

    it('should wrap repository update errors', async () => {
        repoMock.findOneBy.mockResolvedValueOnce({ id: 1, uuid: validUuid, label: 'Admin' });
        repoMock.findOneBy.mockResolvedValueOnce(null);
        repoMock.update.mockRejectedValue(new Error('db-error'));

        await expect(service.update(validUuid, { label: 'Manager' })).rejects.toBeInstanceOf(InternalServerErrorException);
    });

    it('should throw for invalid uuid on remove', async () => {
        await expect(service.remove('bad-uuid')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should remove an existing role', async () => {
        repoMock.findOneBy.mockResolvedValue({ id: 1, uuid: validUuid, label: 'Admin' });
        repoMock.softDelete.mockResolvedValue(undefined);

        await expect(service.remove(validUuid)).resolves.toBeUndefined();
        expect(repoMock.softDelete).toHaveBeenCalledWith({ uuid: validUuid });
    });

    it('should wrap repository softDelete errors', async () => {
        repoMock.findOneBy.mockResolvedValue({ id: 1, uuid: validUuid, label: 'Admin' });
        repoMock.softDelete.mockRejectedValue(new Error('db-error'));

        await expect(service.remove(validUuid)).rejects.toBeInstanceOf(InternalServerErrorException);
    });

    it('should throw for invalid uuid on restore', async () => {
        await expect(service.restore('bad-uuid')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw when trying to restore an existing role', async () => {
        repoMock.findOneBy.mockResolvedValue({ id: 1, uuid: validUuid, label: 'Admin' });

        await expect(service.restore(validUuid)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should restore and return role when deleted entity exists', async () => {
        repoMock.findOneBy.mockResolvedValueOnce(null);
        repoMock.findOneBy.mockResolvedValueOnce({ id: 1, uuid: validUuid, label: 'Admin' });
        repoMock.restore.mockResolvedValue(undefined);

        const result = await service.restore(validUuid);

        expect(repoMock.restore).toHaveBeenCalledWith({ uuid: validUuid });
        expect(result.uuid).toBe(validUuid);
    });

    it('should wrap repository restore errors', async () => {
        repoMock.findOneBy.mockResolvedValueOnce(null);
        repoMock.findOneBy.mockResolvedValueOnce({ id: 1, uuid: validUuid, label: 'Admin' });
        repoMock.restore.mockRejectedValue(new Error('db-error'));

        await expect(service.restore(validUuid)).rejects.toBeInstanceOf(InternalServerErrorException);
    });
});