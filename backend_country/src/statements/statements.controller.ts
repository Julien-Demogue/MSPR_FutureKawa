import { Body, Controller, Delete, Get, HttpCode, ParseIntPipe, ParseUUIDPipe, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiQuery, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { StatementsService } from './statements.service';
import { CreateStatementDto } from './dto/create-statement.dto';
import { UpdateStatementDto } from './dto/update-statement.dto';
import { CommonApiResponses } from '../utils/decorators/common-api-responses.decorator';
import { ApiCreateResponses } from '../utils/decorators/api-create-responses.decorator';
import { Statement } from './statement.entity';
import { ApiFindAllResponses } from '../utils/decorators/api-find-all-response.decorator';
import { ApiFindOneResponse } from '../utils/decorators/api-find-one-responses.decorator';
import { ApiUpdateResponses } from '../utils/decorators/api-update-responses.decorator';
import { ApiDeleteResponses } from '../utils/decorators/api-delete-responses.decorator';
import { ServiceAuthGuard } from '../utils/guards/service-auth.guard';

@ApiTags('statements')
@UseGuards(ServiceAuthGuard)
@ApiSecurity('api-key-auth')
@Controller('statements')
export class StatementsController {
    constructor(private statementsService: StatementsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new statement' })
    @ApiBody({ type: CreateStatementDto })
    @CommonApiResponses()
    @ApiCreateResponses(Statement)
    async create(@Body() createStatementDto: CreateStatementDto) {
        return await this.statementsService.create(createStatementDto);
    }

    @Get()
    @ApiOperation({ summary: 'Retrieve all statements' })
    @CommonApiResponses()
    @ApiFindAllResponses(Statement)
    async findAll() {
        return await this.statementsService.findAll();
    }

    // @Get('/metric')
    // @ApiBody({ type: String, description: 'Metric type to filter by (TEMPERATURE or HUMIDITY)' })
    // @ApiOperation({ summary: 'Retrieve all statements filtered by metric type' })
    // @ApiQuery({ name: 'metricType', required: true, type: String, description: 'Metric type to filter by (TEMPERATURE or HUMIDITY)' })
    // async findAllByMetricType(@Query('metricType') metricType: string) {
    //     return await this.statementsService.findAllByMetricType(metricType);
    // }

    @Get('/uuid')
    @ApiOperation({ summary: 'Retrieve a statement by UUID' })
    @ApiQuery({ name: 'uuid', required: true, type: String })
    @CommonApiResponses()
    @ApiFindOneResponse(Statement)
    async findOneByUuid(@Query('uuid', new ParseUUIDPipe()) uuid: string) {
        return await this.statementsService.findOneByUuid(uuid);
    }

    @Get('/id')
    @ApiOperation({ summary: 'Retrieve a statement by ID' })
    @ApiQuery({ name: 'id', required: true, type: Number })
    @CommonApiResponses()
    @ApiFindOneResponse(Statement)
    async findOneById(@Query('id', new ParseIntPipe()) id: number) {
        return await this.statementsService.findOneById(id);
    }

    @Patch()
    @ApiOperation({ summary: 'Update a statement by UUID' })
    @ApiQuery({ name: 'uuid', required: true, type: String })
    @ApiBody({ type: UpdateStatementDto })
    @CommonApiResponses()
    @ApiUpdateResponses(Statement)
    async update(@Query('uuid', new ParseUUIDPipe()) uuid: string, @Body() updateStatementDto: UpdateStatementDto) {
        return await this.statementsService.update(uuid, updateStatementDto);
    }

    @Delete()
    @ApiOperation({ summary: 'Delete a statement by UUID' })
    @ApiQuery({ name: 'uuid', required: true, type: String })
    @CommonApiResponses()
    @ApiDeleteResponses(Statement)
    async remove(@Query('uuid', new ParseUUIDPipe()) uuid: string) {
        return await this.statementsService.remove(uuid);
    }

    @Patch("/restore")
    @ApiOperation({ summary: 'Restore a deleted statement by UUID' })
    @ApiQuery({ name: 'uuid', required: true, type: String })
    @CommonApiResponses()
    @ApiUpdateResponses(Statement)
    async restore(@Query('uuid', new ParseUUIDPipe()) uuid: string) {
        return await this.statementsService.restore(uuid);
    }
}
