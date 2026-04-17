import { BadRequestException, ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Status } from './status.entity';
import { Repository } from 'typeorm';
import { CreateStatusDto } from './dto/create-status.dto';
import { isNullOrEmpty, isValidId, isValidUuid } from '../utils/fields-validation.utils';
import { ApiResponseMessages } from '../utils/api-response-messages.utils';
import { UpdateStatusDto } from './dto/update-status.dto';
import { v4 as uuidv4 } from 'uuid';
import { BatchesService } from '../batches/batches.service';

@Injectable()
export class StatusesService {
    constructor(@InjectRepository(Status) private repo: Repository<Status>, private batchesService: BatchesService,) { }
    allowedValues = ['OK', 'ALERT', 'EXPIRED', 'SENT', 'DESTROYED'];

    async create(createStatusDto: CreateStatusDto) {
        if (isNullOrEmpty(createStatusDto.value) || !this.allowedValues.includes(createStatusDto.value)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('value'));
        }

        if (!isValidId(createStatusDto.id_batch)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('id_batch'));
        }

        const batch = await this.batchesService.findOneById(createStatusDto.id_batch);
        if (!batch) {
            throw new BadRequestException(ApiResponseMessages.invalidField('id_batch'));
        }

        try {
            const uuid = uuidv4();
            const status = this.repo.create({ ...createStatusDto, uuid });
            return await this.repo.save(status);
        }
        catch (error) {
            throw new InternalServerErrorException(ApiResponseMessages.internalServerError(Status, error));
        }
    }

    async findAll() {
        return await this.repo.find();
    }

    async findAllByValue(value: string) {
        if (isNullOrEmpty(value) || !this.allowedValues.includes(value)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('value'));
        }

        return await this.repo.findBy({ value: value as Status['value'] });
    }

    async findOneByUuid(uuid: string) {
        if (isNullOrEmpty(uuid) || !isValidUuid(uuid)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('uuid'));
        }

        const status = await this.repo.findOneBy({ uuid });
        if (!status) {
            throw new BadRequestException(ApiResponseMessages.notFound(Status));
        }
        return status;
    }

    async findOneById(id: number) {
        if (!isValidId(id)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('id'));
        }

        const status = await this.repo.findOneBy({ id });
        if (!status) {
            throw new BadRequestException(ApiResponseMessages.notFound(Status));
        }
        return status;
    }

    async update(uuid: string, updateStatusDto: UpdateStatusDto) {
        if (!isValidUuid(uuid)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('uuid'));
        }

        if (updateStatusDto.value) {
            if (isNullOrEmpty(updateStatusDto.value) || !this.allowedValues.includes(updateStatusDto.value)) {
                throw new BadRequestException(ApiResponseMessages.invalidField('value'));
            }
        }

        if (updateStatusDto.id_batch !== undefined) {
            if (!isValidId(updateStatusDto.id_batch)) {
                throw new BadRequestException(ApiResponseMessages.invalidField('id_batch'));
            }

            const batch = await this.batchesService.findOneById(updateStatusDto.id_batch);
            if (!batch) {
                throw new BadRequestException(ApiResponseMessages.invalidField('id_batch'));
            }
        }

        await this.findOneByUuid(uuid); // Check if status exists before updating

        try {
            await this.repo.update({ uuid }, updateStatusDto);
            return await this.findOneByUuid(uuid);
        }
        catch (error) {
            throw new InternalServerErrorException(ApiResponseMessages.internalServerError(Status, error));
        }
    }

    async remove(uuid: string) {
        if (!isValidUuid(uuid)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('uuid'));
        }

        await this.findOneByUuid(uuid); // Check if status exists before deleting

        try {
            await this.repo.softDelete({ uuid });
            return;
        }
        catch (error) {
            throw new InternalServerErrorException(ApiResponseMessages.internalServerError(Status, error));
        }
    }

    async restore(uuid: string) {
        if (!isValidUuid(uuid)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('uuid'));
        }

        const existingStatus = await this.repo.findOneBy({ uuid });
        if (existingStatus) {
            throw new BadRequestException(ApiResponseMessages.cantRestoreExisting(Status));
        }

        try {
            await this.repo.restore({ uuid });
            return this.findOneByUuid(uuid);
        }
        catch (error) {
            throw new InternalServerErrorException(ApiResponseMessages.internalServerError(Status, error));
        }
    }
}
