import { BadRequestException, ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Country } from './country.entity';
import { Repository } from 'typeorm';
import { CreateCountryDto } from './dto/create-country.dto';
import { isNullOrEmpty, isValidId, isValidNumber, isValidUuid } from '../utils/fields-validation.utils';
import { ApiResponseMessages } from '../utils/api-response-messages.utils';
import { UpdateCountryDto } from './dto/update-country.dto';

@Injectable()
export class CountriesService {
    constructor(@InjectRepository(Country) private repo: Repository<Country>) { }

    async create(createCountryDto: CreateCountryDto) {
        if(isNullOrEmpty(createCountryDto.name)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('name'));
        }

        if(!isValidNumber(createCountryDto.temperature_ideal)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('temperature_ideal'));
        }

        if(!isValidNumber(createCountryDto.temperature_tolerance_degrees)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('temperature_tolerance_degrees'));
        }

        if(!isValidNumber(createCountryDto.humidity_ideal)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('humidity_ideal'));
        }

        if(!isValidNumber(createCountryDto.humidity_tolerance_percent)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('humidity_tolerance_percent'));
        }

        // Country names should be unique
        const existingCountry = await this.findOneByName(createCountryDto.name);
        if (existingCountry) {
            throw new ConflictException(ApiResponseMessages.alreadyExists(Country, 'name', createCountryDto.name));
        }

        try {
            const country = this.repo.create(createCountryDto);
            return await this.repo.save(country);
        }
        catch (error) {
            throw new InternalServerErrorException(ApiResponseMessages.internalServerError(Country, error));
        }
    }

    async findAll() {
        return await this.repo.find();
    }

    async findOneByUuid(uuid: string) {
        if(isNullOrEmpty(uuid) || !isValidUuid(uuid)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('uuid'));
        }

        const country = await this.repo.findOneBy({ uuid });
        if (!country) {
            throw new BadRequestException(ApiResponseMessages.notFound(Country));
        }
        return country;
    }

    async findOneById(id: number) {
        if (!isValidId(id)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('id'));
        }
        
        const country = await this.repo.findOneBy({ id });
        if (!country) {
            throw new BadRequestException(ApiResponseMessages.notFound(Country));
        }
        return country;
    }

    async findOneByName(name: string) {
        if(isNullOrEmpty(name)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('name'));
        }

        const country = await this.repo.findOneBy({ name });
        if (!country) {
            throw new BadRequestException(ApiResponseMessages.notFound(Country));
        }
        return country;
    }

    async update(uuid: string, updateCountryDto: UpdateCountryDto) {
        if(isNullOrEmpty(uuid) || !isValidUuid(uuid)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('uuid'));
        }

        if(isNullOrEmpty(updateCountryDto.name)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('name'));
        }

        if(!isValidNumber(updateCountryDto.temperature_ideal)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('temperature_ideal'));
        }

        if(!isValidNumber(updateCountryDto.temperature_tolerance_degrees)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('temperature_tolerance_degrees'));
        }

        if(!isValidNumber(updateCountryDto.humidity_ideal)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('humidity_ideal'));
        }

        if(!isValidNumber(updateCountryDto.humidity_tolerance_percent)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('humidity_tolerance_percent'));
        }

        await this.findOneByUuid(uuid); // Ensure the country exists before updating
        
        try {
            await this.repo.update({ uuid }, updateCountryDto);
            return await this.findOneByUuid(uuid);
        }
        catch (error) {
            throw new InternalServerErrorException(ApiResponseMessages.internalServerError(Country, error));
        }
    }

    async remove(uuid: string) {
        if (!isValidUuid(uuid)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('uuid'));
        }

        await this.findOneByUuid(uuid); // Ensure the country exists before deleting

        try {
            await this.repo.softDelete({ uuid });
            return;
        }
        catch (error) {
            throw new InternalServerErrorException(ApiResponseMessages.internalServerError(Country, error));
        }
    }

    async restore(uuid: string) {
        if(isNullOrEmpty(uuid) || !isValidUuid(uuid)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('uuid'));
        }

        await this.findOneByUuid(uuid); // Ensure the country exists before restoring

        try {
            await this.repo.restore({ uuid });
            return this.findOneByUuid(uuid);
        }
        catch (error) {
            throw new InternalServerErrorException(ApiResponseMessages.internalServerError(Country, error));
        }
    }
}
