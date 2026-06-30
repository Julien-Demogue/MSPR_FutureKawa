import { Body, Controller, Delete, Get, HttpCode, ParseIntPipe, ParseUUIDPipe, DefaultValuePipe, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
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
    @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Starting offset for pagination (default: 0)', default: 0 })
    @ApiQuery({ name: 'count', required: false, type: Number, description: 'Number of statements to retrieve (default: 100)', default: 100 })
    @CommonApiResponses()
    @ApiFindAllResponses(Statement)
    async findAll(
        @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
        @Query('count', new DefaultValuePipe(100), ParseIntPipe) count: number
    ) {
        return await this.statementsService.findAll(offset, count);
    }

    @Get('/type')
    @ApiOperation({ summary: 'Retrieve all statements filtered by metric type' })
    @ApiQuery({ name: 'type', required: true, type: String, description: 'Metric type to filter by (TEMPERATURE or HUMIDITY)' })
    @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Starting offset for pagination (default: 0)', default: 0 })
    @ApiQuery({ name: 'count', required: false, type: Number, description: 'Number of statements to retrieve (default: 100)', default: 100 })
    @CommonApiResponses()
    @ApiFindAllResponses(Statement)
    async findAllByType(
        @Query('type') type: string,
        @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
        @Query('count', new DefaultValuePipe(100), ParseIntPipe) count: number
    ) {
        return await this.statementsService.findAllByType(type, offset, count);
    }

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
