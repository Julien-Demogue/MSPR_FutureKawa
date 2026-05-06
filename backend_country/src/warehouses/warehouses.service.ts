import { BadRequestException, ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Warehouse } from './warehouse.entity';
import { Repository } from 'typeorm';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { isNullOrEmpty, isValidId, isValidNumber, isValidPercent, isValidUuid } from '../utils/fields-validation.utils';
import { ApiResponseMessages } from '../utils/api-response-messages.utils';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { v4 as uuidv4 } from 'uuid';
import { FarmsService } from '../farms/farms.service';

@Injectable()
export class WarehousesService {
    constructor(@InjectRepository(Warehouse) private repo: Repository<Warehouse>, private farmsService: FarmsService,) { }

    async create(createWarehouseDto: CreateWarehouseDto) {
        if (isNullOrEmpty(createWarehouseDto.name)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('name'));
        }

        if (!isValidId(createWarehouseDto.id_farm)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('id_farm'));
        }

        const farm = await this.farmsService.findOneById(createWarehouseDto.id_farm);
        if (!farm) {
            throw new BadRequestException(ApiResponseMessages.invalidField('id_farm'));
        }

        try {
            const uuid = uuidv4();
            const warehouse = this.repo.create({ ...createWarehouseDto, uuid });
            return await this.repo.save(warehouse);
        }
        catch (error) {
            throw new InternalServerErrorException(ApiResponseMessages.internalServerError(Warehouse, error));
        }
    }

    async findAll() {
        return await this.repo.find();
    }

    async findOneByUuid(uuid: string) {
        if (isNullOrEmpty(uuid) || !isValidUuid(uuid)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('uuid'));
        }

        const warehouse = await this.repo.findOneBy({ uuid });
        if (!warehouse) {
            throw new BadRequestException(ApiResponseMessages.notFound(Warehouse));
        }
        return warehouse;
    }

    async findOneById(id: number) {
        if (!isValidId(id)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('id'));
        }

        const warehouse = await this.repo.findOneBy({ id });
        if (!warehouse) {
            throw new BadRequestException(ApiResponseMessages.notFound(Warehouse));
        }
        return warehouse;
    }

    async update(uuid: string, updateWarehouseDto: UpdateWarehouseDto) {
        if (!isValidUuid(uuid)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('uuid'));
        }

        if (updateWarehouseDto.name && isNullOrEmpty(updateWarehouseDto.name)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('name'));
        }

        if (updateWarehouseDto.id_farm !== undefined) {
            if (!isValidId(updateWarehouseDto.id_farm)) {
                throw new BadRequestException(ApiResponseMessages.invalidField('id_farm'));
            }

            const farm = await this.farmsService.findOneById(updateWarehouseDto.id_farm);
            if (!farm) {
                throw new BadRequestException(ApiResponseMessages.invalidField('id_farm'));
            }
        }

        await this.findOneByUuid(uuid); // Check if warehouse exists before updating

        try {
            await this.repo.update({ uuid }, updateWarehouseDto);
            return await this.findOneByUuid(uuid);
        }
        catch (error) {
            throw new InternalServerErrorException(ApiResponseMessages.internalServerError(Warehouse, error));
        }
    }

    async remove(uuid: string) {
        if (!isValidUuid(uuid)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('uuid'));
        }

        await this.findOneByUuid(uuid); // Check if warehouse exists before deleting

        try {
            await this.repo.softDelete({ uuid });
            return;
        }
        catch (error) {
            throw new InternalServerErrorException(ApiResponseMessages.internalServerError(Warehouse, error));
        }
    }

    async restore(uuid: string) {
        if (!isValidUuid(uuid)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('uuid'));
        }

        const existingWarehouse = await this.repo.findOneBy({ uuid });
        if (existingWarehouse) {
            throw new BadRequestException(ApiResponseMessages.cantRestoreExisting(Warehouse));
        }

        try {
            await this.repo.restore({ uuid });
            return this.findOneByUuid(uuid);
        }
        catch (error) {
            throw new InternalServerErrorException(ApiResponseMessages.internalServerError(Warehouse, error));
        }
    }
}
