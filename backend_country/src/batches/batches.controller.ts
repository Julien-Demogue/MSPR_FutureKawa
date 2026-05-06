import { Body, Controller, Delete, Get, ParseIntPipe, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { BatchesService } from './batches.service';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';
import { CommonApiResponses } from '../utils/decorators/common-api-responses.decorator';
import { ApiCreateResponses } from '../utils/decorators/api-create-responses.decorator';
import { Batch } from './batch.entity';
import { ApiFindAllResponses } from '../utils/decorators/api-find-all-response.decorator';
import { ApiFindOneResponse } from '../utils/decorators/api-find-one-responses.decorator';
import { ApiUpdateResponses } from '../utils/decorators/api-update-responses.decorator';
import { ApiDeleteResponses } from '../utils/decorators/api-delete-responses.decorator';

@ApiTags('batches')
@Controller('batches')
export class BatchesController {
    constructor(private batchesService: BatchesService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new batch' })
    @ApiBody({ type: CreateBatchDto })
    @CommonApiResponses()
    @ApiCreateResponses(Batch)
    async create(@Body() createBatchDto: CreateBatchDto) {
        return await this.batchesService.create(createBatchDto);
    }

    @Get()
    @ApiOperation({ summary: 'Retrieve all batches' })
    @CommonApiResponses()
    @ApiFindAllResponses(Batch)
    async findAll() {
        return await this.batchesService.findAll();
    }

    @Get('/uuid')
    @ApiOperation({ summary: 'Retrieve a batch by UUID' })
    @ApiQuery({ name: 'uuid', required: true, type: String })
    @CommonApiResponses()
    @ApiFindOneResponse(Batch)
    async findOneByUuid(@Query('uuid', new ParseUUIDPipe()) uuid: string) {
        return await this.batchesService.findOneByUuid(uuid);
    }

    @Get('/id')
    @ApiOperation({ summary: 'Retrieve a batch by ID' })
    @ApiQuery({ name: 'id', required: true, type: Number })
    @CommonApiResponses()
    @ApiFindOneResponse(Batch)
    async findOneById(@Query('id', new ParseIntPipe()) id: number) {
        return await this.batchesService.findOneById(id);
    }

    @Patch()
    @ApiOperation({ summary: 'Update a batch by UUID' })
    @ApiQuery({ name: 'uuid', required: true, type: String })
    @ApiBody({ type: UpdateBatchDto })
    @CommonApiResponses()
    @ApiUpdateResponses(Batch)
    async update(@Query('uuid', new ParseUUIDPipe()) uuid: string, @Body() updateBatchDto: UpdateBatchDto) {
        return await this.batchesService.update(uuid, updateBatchDto);
    }

    @Delete()
    @ApiOperation({ summary: 'Delete a batch by UUID' })
    @ApiQuery({ name: 'uuid', required: true, type: String })
    @CommonApiResponses()
    @ApiDeleteResponses(Batch)
    async remove(@Query('uuid', new ParseUUIDPipe()) uuid: string) {
        return await this.batchesService.remove(uuid);
    }

    @Patch("/restore")
    @ApiOperation({ summary: 'Restore a deleted batch by UUID' })
    @ApiQuery({ name: 'uuid', required: true, type: String })
    @CommonApiResponses()
    @ApiUpdateResponses(Batch)
    async restore(@Query('uuid', new ParseUUIDPipe()) uuid: string) {
        return await this.batchesService.restore(uuid);
    }
}
