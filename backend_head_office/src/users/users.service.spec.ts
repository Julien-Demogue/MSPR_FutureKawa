import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { Role } from '../roles/role.entity';

jest.mock('uuid', () => ({
    v4: jest.fn(() => '550e8400-e29b-41d4-a716-446655440000'),
}));

describe('UsersService', () => {
    let service: UsersService;
    let consoleErrorSpy: jest.SpyInstance;
    const validUuid = '550e8400-e29b-41d4-a716-446655440000';
    const repoMock = {
        findOneBy: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        find: jest.fn(),
        update: jest.fn(),
        softDelete: jest.fn(),
        restore: jest.fn(),
    };
    const rolesRepoMock = {
        findOneBy: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: getRepositoryToken(User),
                    useValue: repoMock,
                },
                {
                    provide: getRepositoryToken(Role),
                    useValue: rolesRepoMock,
                },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
        jest.clearAllMocks();
    });

    beforeAll(() => {
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    afterAll(() => {
        consoleErrorSpy.mockRestore();
    });

    it('should return all users', async () => {
        repoMock.find.mockResolvedValue([{ id: 1, uuid: validUuid, email: 'user@example.com', id_role: 1 }]);

        const result = await service.findAll();

        expect(result).toHaveLength(1);
        expect(repoMock.find).toHaveBeenCalledWith({ relations: { role: true } });
    });

    it('should create a user when payload is valid', async () => {
        const payload = {
            first_name: 'John',
            last_name: 'Doe',
            email: 'john.doe@example.com',
            password: 'secret123',
            id_role: 1,
        };

        rolesRepoMock.findOneBy.mockResolvedValue({ id: 1, label: 'Admin' });
        repoMock.findOneBy.mockResolvedValue(null);
        repoMock.create.mockImplementation((value) => value);
        repoMock.save.mockImplementation(async (value) => ({ id: 1, ...value }));

        const result = await service.create(payload);

        expect(result.id).toBe(1);
        expect(result.uuid).toBeDefined();
        expect(repoMock.create).toHaveBeenCalledWith({ ...payload, uuid: validUuid });
    });

    it('should throw for invalid email on create', async () => {
        await expect(
            service.create({
                first_name: 'John',
                last_name: 'Doe',
                email: 'bad-email',
                password: 'secret123',
                id_role: 1,
            }),
        ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw for invalid password on create', async () => {
        await expect(
            service.create({
                first_name: 'John',
                last_name: 'Doe',
                email: 'john.doe@example.com',
                password: '',
                id_role: 1,
            }),
        ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw for invalid first name on create', async () => {
        await expect(
            service.create({
                first_name: '',
                last_name: 'Doe',
                email: 'john.doe@example.com',
                password: 'secret123',
                id_role: 1,
            }),
        ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw for invalid last name on create', async () => {
        await expect(
            service.create({
                first_name: 'John',
                last_name: '',
                email: 'john.doe@example.com',
                password: 'secret123',
                id_role: 1,
            }),
        ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw for invalid id_role on create', async () => {
        await expect(
            service.create({
                first_name: 'John',
                last_name: 'Doe',
                email: 'john.doe@example.com',
                password: 'secret123',
                id_role: 0,
            }),
        ).rejects.toBeInstanceOf(BadRequestException);
        expect(rolesRepoMock.findOneBy).not.toHaveBeenCalled();
    });

    it('should throw when related role is not found on create', async () => {
        rolesRepoMock.findOneBy.mockResolvedValue(null);

        await expect(
            service.create({
                first_name: 'John',
                last_name: 'Doe',
                email: 'john.doe@example.com',
                password: 'secret123',
                id_role: 1,
            }),
        ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw for duplicate email on create', async () => {
        rolesRepoMock.findOneBy.mockResolvedValue({ id: 1, label: 'Admin' });
        repoMock.findOneBy.mockResolvedValue({ id: 2, uuid: 'other-uuid', email: 'john.doe@example.com' });

        await expect(
            service.create({
                first_name: 'John',
                last_name: 'Doe',
                email: 'john.doe@example.com',
                password: 'secret123',
                id_role: 1,
            }),
        ).rejects.toBeInstanceOf(ConflictException);
    });

    it('should wrap repository save errors on create', async () => {
        rolesRepoMock.findOneBy.mockResolvedValue({ id: 1, label: 'Admin' });
        repoMock.findOneBy.mockResolvedValue(null);
        repoMock.create.mockImplementation((value) => value);
        repoMock.save.mockRejectedValue(new Error('db-error'));

        await expect(
            service.create({
                first_name: 'John',
                last_name: 'Doe',
                email: 'john.doe@example.com',
                password: 'secret123',
                id_role: 1,
            }),
        ).rejects.toBeInstanceOf(InternalServerErrorException);
    });

    it('should throw for invalid uuid in findOneByUuid', async () => {
        await expect(service.findOneByUuid('bad-uuid')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw when user uuid is not found', async () => {
        repoMock.findOne.mockResolvedValue(null);

        await expect(service.findOneByUuid(validUuid)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should return one user by uuid', async () => {
        repoMock.findOne.mockResolvedValue({ id: 1, uuid: validUuid, email: 'john.doe@example.com', id_role: 1, role: { id: 1, label: 'Admin' } });

        const result = await service.findOneByUuid(validUuid);

        expect(result.uuid).toBe(validUuid);
        expect(repoMock.findOne).toHaveBeenCalledWith({ where: { uuid: validUuid }, relations: { role: true } });
    });

    it('should throw for invalid id in findOneById', async () => {
        await expect(service.findOneById(0)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw when user id is not found', async () => {
        repoMock.findOne.mockResolvedValue(null);

        await expect(service.findOneById(1)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should return one user by id', async () => {
        repoMock.findOne.mockResolvedValue({ id: 1, uuid: validUuid, email: 'john.doe@example.com', id_role: 1, role: { id: 1, label: 'Admin' } });

        const result = await service.findOneById(1);

        expect(result.id).toBe(1);
    });

    it('should throw for invalid email in findOneByEmail', async () => {
        await expect(service.findOneByEmail('bad-email')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw when user email is not found', async () => {
        repoMock.findOne.mockResolvedValue(null);

        await expect(service.findOneByEmail('john.doe@example.com')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should return one user by email', async () => {
        repoMock.findOne.mockResolvedValue({ id: 1, uuid: validUuid, email: 'john.doe@example.com', id_role: 1, role: { id: 1, label: 'Admin' } });

        const result = await service.findOneByEmail('john.doe@example.com');

        expect(result.email).toBe('john.doe@example.com');
    });

    it('should throw for invalid uuid on update', async () => {
        await expect(service.update('bad-uuid', { first_name: 'Jane' })).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw for invalid email on update', async () => {
        await expect(service.update(validUuid, { email: 'bad-email' })).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw for invalid password on update', async () => {
        await expect(service.update(validUuid, { password: '' })).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw for invalid first name on update', async () => {
        await expect(service.update(validUuid, { first_name: '' })).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw for invalid last name on update', async () => {
        await expect(service.update(validUuid, { last_name: '' })).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw for invalid id_role on update', async () => {
        await expect(service.update(validUuid, { id_role: 0 })).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw when related role is not found on update', async () => {
        rolesRepoMock.findOneBy.mockResolvedValue(null);

        await expect(service.update(validUuid, { id_role: 2 })).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw for duplicate email on update', async () => {
        repoMock.findOne.mockResolvedValueOnce({ id: 1, uuid: validUuid, email: 'john.doe@example.com', id_role: 1, role: { id: 1, label: 'Admin' } });
        repoMock.findOneBy.mockResolvedValue({ id: 2, uuid: 'other-uuid', email: 'jane.doe@example.com' });

        await expect(service.update(validUuid, { email: 'jane.doe@example.com' })).rejects.toBeInstanceOf(ConflictException);
    });

    it('should update and return the user', async () => {
        repoMock.findOne.mockResolvedValueOnce({ id: 1, uuid: validUuid, email: 'john.doe@example.com', id_role: 1, role: { id: 1, label: 'Admin' } });
        repoMock.findOneBy.mockResolvedValue(null);
        repoMock.update.mockResolvedValue(undefined);
        repoMock.findOne.mockResolvedValueOnce({ id: 1, uuid: validUuid, email: 'john.doe@example.com', first_name: 'Jane', id_role: 1, role: { id: 1, label: 'Admin' } });

        const result = await service.update(validUuid, { first_name: 'Jane' });

        expect(repoMock.update).toHaveBeenCalledWith({ uuid: validUuid }, { first_name: 'Jane' });
        expect(result.uuid).toBe(validUuid);
    });

    it('should wrap repository update errors', async () => {
        repoMock.findOne.mockResolvedValueOnce({ id: 1, uuid: validUuid, email: 'john.doe@example.com', id_role: 1, role: { id: 1, label: 'Admin' } });
        repoMock.findOneBy.mockResolvedValue(null);
        repoMock.update.mockRejectedValue(new Error('db-error'));

        await expect(service.update(validUuid, { first_name: 'Jane' })).rejects.toBeInstanceOf(InternalServerErrorException);
    });

    it('should throw for invalid uuid on remove', async () => {
        await expect(service.remove('bad-uuid')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should remove an existing user', async () => {
        repoMock.findOne.mockResolvedValue({ id: 1, uuid: validUuid, email: 'john.doe@example.com', id_role: 1, role: { id: 1, label: 'Admin' } });
        repoMock.softDelete.mockResolvedValue(undefined);

        await expect(service.remove(validUuid)).resolves.toBeUndefined();
        expect(repoMock.softDelete).toHaveBeenCalledWith({ uuid: validUuid });
    });

    it('should wrap repository softDelete errors', async () => {
        repoMock.findOne.mockResolvedValue({ id: 1, uuid: validUuid, email: 'john.doe@example.com', id_role: 1, role: { id: 1, label: 'Admin' } });
        repoMock.softDelete.mockRejectedValue(new Error('db-error'));

        await expect(service.remove(validUuid)).rejects.toBeInstanceOf(InternalServerErrorException);
    });

    it('should throw for invalid uuid on restore', async () => {
        await expect(service.restore('bad-uuid')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw when trying to restore an existing user', async () => {
        repoMock.findOneBy.mockResolvedValue({ id: 1, uuid: validUuid, email: 'john.doe@example.com' });

        await expect(service.restore(validUuid)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should restore and return user when deleted entity exists', async () => {
        repoMock.findOneBy.mockResolvedValueOnce(null);
        repoMock.findOne.mockResolvedValueOnce({ id: 1, uuid: validUuid, email: 'john.doe@example.com', id_role: 1, role: { id: 1, label: 'Admin' } });
        repoMock.restore.mockResolvedValue(undefined);

        const result = await service.restore(validUuid);

        expect(repoMock.restore).toHaveBeenCalledWith({ uuid: validUuid });
        expect(result.uuid).toBe(validUuid);
    });

    it('should wrap repository restore errors', async () => {
        repoMock.findOneBy.mockResolvedValueOnce(null);
        repoMock.restore.mockRejectedValue(new Error('db-error'));

        await expect(service.restore(validUuid)).rejects.toBeInstanceOf(InternalServerErrorException);
    });
});