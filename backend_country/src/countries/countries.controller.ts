import { Body, Controller, Delete, Get, HttpCode, ParseIntPipe, ParseUUIDPipe, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CountriesService } from './countries.service';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';
import { CommonApiResponses } from '../utils/decorators/common-api-responses.decorator';
import { ApiCreateResponses } from '../utils/decorators/api-create-responses.decorator';
import { Country } from './country.entity';
import { ApiFindAllResponses } from '../utils/decorators/api-find-all-response.decorator';
import { ApiFindOneResponse } from '../utils/decorators/api-find-one-responses.decorator';
import { ApiUpdateResponses } from '../utils/decorators/api-update-responses.decorator';
import { ApiDeleteResponses } from '../utils/decorators/api-delete-responses.decorator';
import { ServiceAuthGuard } from '../utils/guards/service-auth.guard';

@ApiTags('countries')
@UseGuards(ServiceAuthGuard)
@Controller('countries')
export class CountriesController {
    constructor(private countriesService: CountriesService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new country' })
    @ApiBody({ type: CreateCountryDto })
    @CommonApiResponses()
    @ApiCreateResponses(Country)
    async create(@Body() createCountryDto: CreateCountryDto) {
        return await this.countriesService.create(createCountryDto);
    }

    @Get()
    @ApiOperation({ summary: 'Retrieve all countries' })
    @CommonApiResponses()
    @ApiFindAllResponses(Country)
    async findAll() {
        return await this.countriesService.findAll();
    }

    @Get('/uuid')
    @ApiOperation({ summary: 'Retrieve a country by UUID' })
    @ApiQuery({ name: 'uuid', required: true, type: String })
    @CommonApiResponses()
    @ApiFindOneResponse(Country)
    async findOneByUuid(@Query('uuid', new ParseUUIDPipe()) uuid: string) {
        return await this.countriesService.findOneByUuid(uuid);
    }

    @Get('/id')
    @ApiOperation({ summary: 'Retrieve a country by ID' })
    @ApiQuery({ name: 'id', required: true, type: Number })
    @CommonApiResponses()
    @ApiFindOneResponse(Country)
    async findOneById(@Query('id', new ParseIntPipe()) id: number) {
        return await this.countriesService.findOneById(id);
    }

    @Get('/name')
    @ApiOperation({ summary: 'Retrieve a country by name' })
    @ApiQuery({ name: 'name', required: true, type: String })
    @CommonApiResponses()
    @ApiFindOneResponse(Country)
    async findOneByName(@Query('name') name: string) {
        return await this.countriesService.findOneByName(name);
    }

    @Patch()
    @ApiOperation({ summary: 'Update a country by UUID' })
    @ApiQuery({ name: 'uuid', required: true, type: String })
    @ApiBody({ type: UpdateCountryDto })
    @CommonApiResponses()
    @ApiUpdateResponses(Country)
    async update(@Query('uuid', new ParseUUIDPipe()) uuid: string, @Body() updateCountryDto: UpdateCountryDto) {
        return await this.countriesService.update(uuid, updateCountryDto);
    }

    @Delete()
    @ApiOperation({ summary: 'Delete a country by UUID' })
    @ApiQuery({ name: 'uuid', required: true, type: String })
    @CommonApiResponses()
    @ApiDeleteResponses(Country)
    async remove(@Query('uuid', new ParseUUIDPipe()) uuid: string) {
        return await this.countriesService.remove(uuid);
    }

    @Patch("/restore")
    @ApiOperation({ summary: 'Restore a deleted country by UUID' })
    @ApiQuery({ name: 'uuid', required: true, type: String })
    @CommonApiResponses()
    @ApiUpdateResponses(Country)
    async restore(@Query('uuid', new ParseUUIDPipe()) uuid: string) {
        return await this.countriesService.restore(uuid);
    }
}
