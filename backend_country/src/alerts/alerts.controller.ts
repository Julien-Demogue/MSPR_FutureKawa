import { Body, Controller, Delete, Get, ParseIntPipe, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AlertsService } from './alerts.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';
import { CommonApiResponses } from '../utils/decorators/common-api-responses.decorator';
import { ApiCreateResponses } from '../utils/decorators/api-create-responses.decorator';
import { Alert } from './alert.entity';
import { ApiFindAllResponses } from '../utils/decorators/api-find-all-response.decorator';
import { ApiFindOneResponse } from '../utils/decorators/api-find-one-responses.decorator';
import { ApiUpdateResponses } from '../utils/decorators/api-update-responses.decorator';
import { ApiDeleteResponses } from '../utils/decorators/api-delete-responses.decorator';
import { ServiceAuthGuard } from '../utils/guards/service-auth.guard';

@ApiTags('alerts')
@UseGuards(ServiceAuthGuard)
@Controller('alerts')
export class AlertsController {
    constructor(private alertsService: AlertsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new alert' })
    @ApiBody({ type: CreateAlertDto })
    @CommonApiResponses()
    @ApiCreateResponses(Alert)
    async create(@Body() createAlertDto: CreateAlertDto) {
        return await this.alertsService.create(createAlertDto);
    }

    @Get()
    @ApiOperation({ summary: 'Retrieve all alerts' })
    @CommonApiResponses()
    @ApiFindAllResponses(Alert)
    async findAll() {
        return await this.alertsService.findAll();
    }

    @Get('/uuid')
    @ApiOperation({ summary: 'Retrieve an alert by UUID' })
    @ApiQuery({ name: 'uuid', required: true, type: String })
    @CommonApiResponses()
    @ApiFindOneResponse(Alert)
    async findOneByUuid(@Query('uuid', new ParseUUIDPipe()) uuid: string) {
        return await this.alertsService.findOneByUuid(uuid);
    }

    @Get('/id')
    @ApiOperation({ summary: 'Retrieve an alert by ID' })
    @ApiQuery({ name: 'id', required: true, type: Number })
    @CommonApiResponses()
    @ApiFindOneResponse(Alert)
    async findOneById(@Query('id', new ParseIntPipe()) id: number) {
        return await this.alertsService.findOneById(id);
    }

    @Patch()
    @ApiOperation({ summary: 'Update an alert by UUID' })
    @ApiQuery({ name: 'uuid', required: true, type: String })
    @ApiBody({ type: UpdateAlertDto })
    @CommonApiResponses()
    @ApiUpdateResponses(Alert)
    async update(@Query('uuid', new ParseUUIDPipe()) uuid: string, @Body() updateAlertDto: UpdateAlertDto) {
        return await this.alertsService.update(uuid, updateAlertDto);
    }

    @Delete()
    @ApiOperation({ summary: 'Delete an alert by UUID' })
    @ApiQuery({ name: 'uuid', required: true, type: String })
    @CommonApiResponses()
    @ApiDeleteResponses(Alert)
    async remove(@Query('uuid', new ParseUUIDPipe()) uuid: string) {
        return await this.alertsService.remove(uuid);
    }

    @Patch("/restore")
    @ApiOperation({ summary: 'Restore a deleted alert by UUID' })
    @ApiQuery({ name: 'uuid', required: true, type: String })
    @CommonApiResponses()
    @ApiUpdateResponses(Alert)
    async restore(@Query('uuid', new ParseUUIDPipe()) uuid: string) {
        return await this.alertsService.restore(uuid);
    }
}
