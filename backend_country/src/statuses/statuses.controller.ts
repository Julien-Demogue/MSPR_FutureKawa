import { Body, Controller, Delete, Get, ParseIntPipe, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { StatusesService } from './statuses.service';
import { CreateStatusDto } from './dto/create-status.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { CommonApiResponses } from '../utils/decorators/common-api-responses.decorator';
import { ApiCreateResponses } from '../utils/decorators/api-create-responses.decorator';
import { Status } from './status.entity';
import { ApiFindAllResponses } from '../utils/decorators/api-find-all-response.decorator';
import { ApiFindOneResponse } from '../utils/decorators/api-find-one-responses.decorator';
import { ApiUpdateResponses } from '../utils/decorators/api-update-responses.decorator';
import { ApiDeleteResponses } from '../utils/decorators/api-delete-responses.decorator';
import { ServiceAuthGuard } from '../utils/guards/service-auth.guard';

@ApiTags('statuses')
@UseGuards(ServiceAuthGuard)
@Controller('statuses')
export class StatusesController {
    constructor(private statusesService: StatusesService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new status' })
    @ApiBody({ type: CreateStatusDto })
    @CommonApiResponses()
    @ApiCreateResponses(Status)
    async create(@Body() createStatusDto: CreateStatusDto) {
        return await this.statusesService.create(createStatusDto);
    }

    @Get()
    @ApiOperation({ summary: 'Retrieve all statuses' })
    @CommonApiResponses()
    @ApiFindAllResponses(Status)
    async findAll() {
        return await this.statusesService.findAll();
    }

    @Get('/uuid')
    @ApiOperation({ summary: 'Retrieve a status by UUID' })
    @ApiQuery({ name: 'uuid', required: true, type: String })
    @CommonApiResponses()
    @ApiFindOneResponse(Status)
    async findOneByUuid(@Query('uuid', new ParseUUIDPipe()) uuid: string) {
        return await this.statusesService.findOneByUuid(uuid);
    }

    @Get('/id')
    @ApiOperation({ summary: 'Retrieve a status by ID' })
    @ApiQuery({ name: 'id', required: true, type: Number })
    @CommonApiResponses()
    @ApiFindOneResponse(Status)
    async findOneById(@Query('id', new ParseIntPipe()) id: number) {
        return await this.statusesService.findOneById(id);
    }

    @Get('/value')
    @ApiOperation({ summary: 'Retrieve statuses by value' })
    @ApiQuery({ name: 'value', required: true, type: String })
    @CommonApiResponses()
    @ApiFindAllResponses(Status)
    async findAllByValue(@Query('value') value: string) {
        return await this.statusesService.findAllByValue(value);
    }

    @Patch()
    @ApiOperation({ summary: 'Update a status by UUID' })
    @ApiQuery({ name: 'uuid', required: true, type: String })
    @ApiBody({ type: UpdateStatusDto })
    @CommonApiResponses()
    @ApiUpdateResponses(Status)
    async update(@Query('uuid', new ParseUUIDPipe()) uuid: string, @Body() updateStatusDto: UpdateStatusDto) {
        return await this.statusesService.update(uuid, updateStatusDto);
    }

    @Delete()
    @ApiOperation({ summary: 'Delete a status by UUID' })
    @ApiQuery({ name: 'uuid', required: true, type: String })
    @CommonApiResponses()
    @ApiDeleteResponses(Status)
    async remove(@Query('uuid', new ParseUUIDPipe()) uuid: string) {
        return await this.statusesService.remove(uuid);
    }

    @Patch("/restore")
    @ApiOperation({ summary: 'Restore a deleted status by UUID' })
    @ApiQuery({ name: 'uuid', required: true, type: String })
    @CommonApiResponses()
    @ApiUpdateResponses(Status)
    async restore(@Query('uuid', new ParseUUIDPipe()) uuid: string) {
        return await this.statusesService.restore(uuid);
    }
}
