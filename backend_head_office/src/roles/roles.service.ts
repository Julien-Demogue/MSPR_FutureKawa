import { BadRequestException, ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Role } from './role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ApiResponseMessages } from '../utils/api-response-messages.utils';
import { isNullOrEmpty, isValidId, isValidUuid } from '../utils/fields-validation.utils';

@Injectable()
export class RolesService {
    constructor(@InjectRepository(Role) private repo: Repository<Role>) { }

    async create(createRoleDto: CreateRoleDto) {
        if (isNullOrEmpty(createRoleDto.label)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('label'));
        }

        // Label should be unique
        const existingRole = await this.repo.findOneBy({ label: createRoleDto.label, });
        if (existingRole) {
            throw new ConflictException(ApiResponseMessages.alreadyExists(Role, 'label', createRoleDto.label));
        }

        try {
            const role = this.repo.create({ ...createRoleDto, uuid: uuidv4() });
            return await this.repo.save(role);
        } catch (error) {
            throw new InternalServerErrorException(
                ApiResponseMessages.internalServerError(Role, error),
            );
        }
    }

    async findAll() {
        return await this.repo.find();
    }

    async findOneByUuid(uuid: string) {
        if (!isValidUuid(uuid)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('uuid'));
        }

        const role = await this.repo.findOneBy({ uuid });
        if (!role) {
            throw new BadRequestException(ApiResponseMessages.notFound(Role));
        }

        return role;
    }

    async findOneById(id: number) {
        if (!isValidId(id)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('id'));
        }

        const role = await this.repo.findOneBy({ id });
        if (!role) {
            throw new BadRequestException(ApiResponseMessages.notFound(Role));
        }

        return role;
    }

    async findOneByLabel(label: string) {
        if (isNullOrEmpty(label)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('label'));
        }

        const role = await this.repo.findOneBy({ label });
        if (!role) {
            throw new BadRequestException(ApiResponseMessages.notFound(Role));
        }

        return role;
    }

    async update(uuid: string, updateRoleDto: UpdateRoleDto) {
        if (!isValidUuid(uuid)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('uuid'));
        }

        if (updateRoleDto.label !== undefined && isNullOrEmpty(updateRoleDto.label)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('label'));
        }

        await this.findOneByUuid(uuid);

        if (updateRoleDto.label) {
            const existingRole = await this.repo.findOneBy({ label: updateRoleDto.label });
            if (existingRole && existingRole.uuid !== uuid) {
                throw new ConflictException(ApiResponseMessages.alreadyExists(Role, 'label', updateRoleDto.label));
            }
        }

        try {
            await this.repo.update({ uuid }, updateRoleDto);
            return await this.findOneByUuid(uuid);
        } catch (error) {
            throw new InternalServerErrorException(ApiResponseMessages.internalServerError(Role, error));
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
            throw new InternalServerErrorException(ApiResponseMessages.internalServerError(Role, error));
        }
    }

    async restore(uuid: string) {
        if (!isValidUuid(uuid)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('uuid'));
        }

        const existingRole = await this.repo.findOneBy({ uuid });
        if (existingRole) {
            throw new BadRequestException(ApiResponseMessages.cantRestoreExisting(Role));
        }

        try {
            await this.repo.restore({ uuid });
            return await this.findOneByUuid(uuid);
        } catch (error) {
            throw new InternalServerErrorException(ApiResponseMessages.internalServerError(Role, error));
        }
    }
}
