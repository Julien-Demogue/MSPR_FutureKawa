import { BadRequestException, ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Farm } from './farm.entity';
import { Repository } from 'typeorm';
import { CreateFarmDto } from './dto/create-farm.dto';
import { isNullOrEmpty, isValidId, isValidNumber, isValidPercent, isValidUuid } from '../utils/fields-validation.utils';
import { ApiResponseMessages } from '../utils/api-response-messages.utils';
import { UpdateFarmDto } from './dto/update-farm.dto';
import { v4 as uuidv4 } from 'uuid';
import { CountriesService } from '../countries/countries.service';

@Injectable()
export class FarmsService {
    constructor(@InjectRepository(Farm) private repo: Repository<Farm>, private countriesService: CountriesService,) { }

    async create(createFarmDto: CreateFarmDto) {
        if (isNullOrEmpty(createFarmDto.name)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('name'));
        }

        if (!isValidId(createFarmDto.id_country)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('id_country'));
        }

        const country = await this.countriesService.findOneById(createFarmDto.id_country);
        if (!country) {
            throw new BadRequestException(ApiResponseMessages.invalidField('id_country'));
        }

        try {
            const uuid = uuidv4();
            const farm = this.repo.create({ ...createFarmDto, uuid });
            return await this.repo.save(farm);
        }
        catch (error) {
            throw new InternalServerErrorException(ApiResponseMessages.internalServerError(Farm, error));
        }
    }

    async findAll() {
        return await this.repo.find();
    }

    async findOneByUuid(uuid: string) {
        if (isNullOrEmpty(uuid) || !isValidUuid(uuid)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('uuid'));
        }

        const farm = await this.repo.findOneBy({ uuid });
        if (!farm) {
            throw new BadRequestException(ApiResponseMessages.notFound(Farm));
        }
        return farm;
    }

    async findOneById(id: number) {
        if (!isValidId(id)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('id'));
        }

        const farm = await this.repo.findOneBy({ id });
        if (!farm) {
            throw new BadRequestException(ApiResponseMessages.notFound(Farm));
        }
        return farm;
    }

    async update(uuid: string, updateFarmDto: UpdateFarmDto) {
        if (!isValidUuid(uuid)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('uuid'));
        }

        if (updateFarmDto.name && isNullOrEmpty(updateFarmDto.name)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('name'));
        }

        if (updateFarmDto.id_country) {
            if (!isValidId(updateFarmDto.id_country)) {
                throw new BadRequestException(ApiResponseMessages.invalidField('id_country'));
            }

            const country = await this.countriesService.findOneById(updateFarmDto.id_country);
            if (!country) {
                throw new BadRequestException(ApiResponseMessages.invalidField('id_country'));
            }
        }

        await this.findOneByUuid(uuid); // Check if farm exists before updating

        try {
            await this.repo.update({ uuid }, updateFarmDto);
            return await this.findOneByUuid(uuid);
        }
        catch (error) {
            throw new InternalServerErrorException(ApiResponseMessages.internalServerError(Farm, error));
        }
    }

    async remove(uuid: string) {
        if (!isValidUuid(uuid)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('uuid'));
        }

        await this.findOneByUuid(uuid); // Check if farm exists before deleting

        try {
            await this.repo.softDelete({ uuid });
            return;
        }
        catch (error) {
            throw new InternalServerErrorException(ApiResponseMessages.internalServerError(Farm, error));
        }
    }

    async restore(uuid: string) {
        if (!isValidUuid(uuid)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('uuid'));
        }

        const existingFarm = await this.repo.findOneBy({ uuid });
        if (existingFarm) {
            throw new BadRequestException(ApiResponseMessages.cantRestoreExisting(Farm));
        }

        try {
            await this.repo.restore({ uuid });
            return this.findOneByUuid(uuid);
        }
        catch (error) {
            throw new InternalServerErrorException(ApiResponseMessages.internalServerError(Farm, error));
        }
    }
}
