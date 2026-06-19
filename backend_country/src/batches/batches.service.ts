import { BadRequestException, ConflictException, forwardRef, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Batch } from './batch.entity';
import { Repository } from 'typeorm';
import { CreateBatchDto } from './dto/create-batch.dto';
import { isNullOrEmpty, isValidId, isValidNumber, isValidPercent, isValidUuid } from '../utils/fields-validation.utils';
import { ApiResponseMessages } from '../utils/api-response-messages.utils';
import { UpdateBatchDto } from './dto/update-batch.dto';
import { v4 as uuidv4 } from 'uuid';
import { WarehousesService } from '../warehouses/warehouses.service';
import { StatusesService } from '../statuses/statuses.service';

@Injectable()
export class BatchesService {
    constructor(
        @InjectRepository(Batch) private repo: Repository<Batch>,
        private warehousesService: WarehousesService,
        @Inject(forwardRef(() => StatusesService)) private statusesService: StatusesService
    ) { }

    async create(createBatchDto: CreateBatchDto) {
        if (!isValidId(createBatchDto.id_warehouse)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('id_warehouse'));
        }

        const warehouse = await this.warehousesService.findOneById(createBatchDto.id_warehouse);
        if (!warehouse) {
            throw new BadRequestException(ApiResponseMessages.invalidField('id_warehouse'));
        }

        try {
            const uuid = uuidv4();

            const batch = this.repo.create({ ...createBatchDto, uuid });
            const savedBatch = await this.repo.save(batch);

            // Create an associated status to OK 
            await this.statusesService.create({ value: 'OK', id_batch: batch.id });

            return savedBatch;
        }
        catch (error) {
            throw new InternalServerErrorException(ApiResponseMessages.internalServerError(Batch, error));
        }
    }

    async findAll() {
        return await this.repo.find();
    }

    async findOneByUuid(uuid: string) {
        if (isNullOrEmpty(uuid) || !isValidUuid(uuid)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('uuid'));
        }

        const batch = await this.repo.findOneBy({ uuid });
        if (!batch) {
            throw new BadRequestException(ApiResponseMessages.notFound(Batch));
        }
        return batch;
    }

    async findOneById(id: number) {
        if (!isValidId(id)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('id'));
        }

        const batch = await this.repo.findOneBy({ id });
        if (!batch) {
            throw new BadRequestException(ApiResponseMessages.notFound(Batch));
        }
        return batch;
    }

    async update(uuid: string, updateBatchDto: UpdateBatchDto) {
        if (!isValidUuid(uuid)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('uuid'));
        }

        if (updateBatchDto.id_warehouse !== undefined) {
            if (!isValidId(updateBatchDto.id_warehouse)) {
                throw new BadRequestException(ApiResponseMessages.invalidField('id_warehouse'));
            }

            const warehouse = await this.warehousesService.findOneById(updateBatchDto.id_warehouse);
            if (!warehouse) {
                throw new BadRequestException(ApiResponseMessages.invalidField('id_warehouse'));
            }
        }

        await this.findOneByUuid(uuid); // Check if batch exists before updating

        try {
            await this.repo.update({ uuid }, updateBatchDto);
            return await this.findOneByUuid(uuid);
        }
        catch (error) {
            throw new InternalServerErrorException(ApiResponseMessages.internalServerError(Batch, error));
        }
    }

    async remove(uuid: string) {
        if (!isValidUuid(uuid)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('uuid'));
        }

        await this.findOneByUuid(uuid); // Check if batch exists before deleting

        try {
            await this.repo.softDelete({ uuid });
            return;
        }
        catch (error) {
            throw new InternalServerErrorException(ApiResponseMessages.internalServerError(Batch, error));
        }
    }

    async restore(uuid: string) {
        if (!isValidUuid(uuid)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('uuid'));
        }

        const existingBatch = await this.repo.findOneBy({ uuid });
        if (existingBatch) {
            throw new BadRequestException(ApiResponseMessages.cantRestoreExisting(Batch));
        }

        try {
            await this.repo.restore({ uuid });
            return this.findOneByUuid(uuid);
        }
        catch (error) {
            throw new InternalServerErrorException(ApiResponseMessages.internalServerError(Batch, error));
        }
    }
}
