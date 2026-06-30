import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { User } from './user.entity';
import { Role } from '../roles/role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiResponseMessages } from '../utils/api-response-messages.utils';
import { isNullOrEmpty, isValidEmail, isValidId, isValidUuid } from '../utils/fields-validation.utils';
import bcrypt from 'bcrypt';
import { RolesService } from '../roles/roles.service';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User) private repo: Repository<User>,
        private readonly rolesService: RolesService,
    ) { }

    async create(createUserDto: CreateUserDto) {
        if (isNullOrEmpty(createUserDto.email) || !isValidEmail(createUserDto.email)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('email'));
        }

        if (isNullOrEmpty(createUserDto.password)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('password'));
        }

        if (isNullOrEmpty(createUserDto.role_label)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('role_label'));
        }

        const role = await this.rolesService.findOneByLabel(createUserDto.role_label);
        if (!role) {
            throw new BadRequestException(ApiResponseMessages.notFound(Role));
        }

        const existingUser = await this.repo.findOneBy({ email: createUserDto.email });
        if (existingUser) {
            throw new ConflictException(ApiResponseMessages.alreadyExists(User, 'email', createUserDto.email));
        }

        try {
            createUserDto.password = await bcrypt.hash(createUserDto.password, 10);
            const user = this.repo.create({ ...createUserDto, uuid: uuidv4(), role, id_role: role.id });
            return await this.repo.save(user);
        } catch (error) {
            throw new InternalServerErrorException(ApiResponseMessages.internalServerError(User, error));
        }
    }

    async findAll() {
        return await this.repo.find({ relations: { role: true } });
    }

    async findOneByUuid(uuid: string) {
        if (!isValidUuid(uuid)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('uuid'));
        }

        const user = await this.repo.findOne({ where: { uuid }, relations: { role: true } });
        if (!user) {
            throw new BadRequestException(ApiResponseMessages.notFound(User));
        }

        return user;
    }

    async findOneById(id: number) {
        if (!isValidId(id)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('id'));
        }

        const user = await this.repo.findOne({ where: { id }, relations: { role: true } });
        if (!user) {
            throw new BadRequestException(ApiResponseMessages.notFound(User));
        }

        return user;
    }

    async findOneByEmail(email: string) {
        if (isNullOrEmpty(email) || !isValidEmail(email)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('email'));
        }

        const user = await this.repo.findOne({ where: { email }, relations: { role: true } });
        if (!user) {
            throw new BadRequestException(ApiResponseMessages.notFound(User));
        }

        return user;
    }

    async update(uuid: string, updateUserDto: UpdateUserDto) {
        if (!isValidUuid(uuid)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('uuid'));
        }

        if (updateUserDto.email !== undefined && (!isValidEmail(updateUserDto.email) || isNullOrEmpty(updateUserDto.email))) {
            throw new BadRequestException(ApiResponseMessages.invalidField('email'));
        }

        if (updateUserDto.password !== undefined && isNullOrEmpty(updateUserDto.password)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('password'));
        }

        if (updateUserDto.first_name !== undefined && isNullOrEmpty(updateUserDto.first_name)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('first_name'));
        }

        if (updateUserDto.last_name !== undefined && isNullOrEmpty(updateUserDto.last_name)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('last_name'));
        }

        if (updateUserDto.role_label !== undefined) {
            if (isNullOrEmpty(updateUserDto.role_label)) {
                throw new BadRequestException(ApiResponseMessages.invalidField('role_label'));
            }

            const role = await this.rolesService.findOneByLabel(updateUserDto.role_label);
            if (!role) {
                throw new BadRequestException(ApiResponseMessages.notFound(Role));
            }
        }

        await this.findOneByUuid(uuid);

        if (updateUserDto.email) {
            const existingUser = await this.repo.findOneBy({ email: updateUserDto.email });
            if (existingUser && existingUser.uuid !== uuid) {
                throw new ConflictException(ApiResponseMessages.alreadyExists(User, 'email', updateUserDto.email));
            }
        }

        try {
            if (updateUserDto.password) {
                updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
            }
            await this.repo.update({ uuid }, updateUserDto);
            return await this.findOneByUuid(uuid);
        } catch (error) {
            throw new InternalServerErrorException(ApiResponseMessages.internalServerError(User, error));
        }
    }

    async remove(uuid: string) {
        if (!isValidUuid(uuid)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('uuid'));
        }

        await this.findOneByUuid(uuid);

        try {
            await this.repo.softDelete({ uuid });
            return;
        } catch (error) {
            throw new InternalServerErrorException(ApiResponseMessages.internalServerError(User, error));
        }
    }

    async restore(uuid: string) {
        if (!isValidUuid(uuid)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('uuid'));
        }

        const existingUser = await this.repo.findOneBy({ uuid });
        if (existingUser) {
            throw new BadRequestException(ApiResponseMessages.cantRestoreExisting(User));
        }

        try {
            await this.repo.restore({ uuid });
            return await this.findOneByUuid(uuid);
        } catch (error) {
            throw new InternalServerErrorException(ApiResponseMessages.internalServerError(User, error));
        }
    }
}
