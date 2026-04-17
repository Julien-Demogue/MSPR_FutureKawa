import { Body, Controller, Delete, Get, HttpCode, ParseIntPipe, ParseUUIDPipe, Patch, Post, Query, Res } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { WarehousesService } from './warehouses.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { CommonApiResponses } from '../utils/decorators/common-api-responses.decorator';
import { ApiCreateResponses } from '../utils/decorators/api-create-responses.decorator';
import { Warehouse } from './warehouse.entity';
import { ApiFindAllResponses } from '../utils/decorators/api-find-all-response.decorator';
import { ApiFindOneResponse } from '../utils/decorators/api-find-one-responses.decorator';
import { ApiUpdateResponses } from '../utils/decorators/api-update-responses.decorator';
import { ApiDeleteResponses } from '../utils/decorators/api-delete-responses.decorator';

@ApiTags('warehouses')
@Controller('warehouses')
export class WarehousesController {
    constructor(private warehousesService: WarehousesService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new warehouse' })
    @ApiBody({ type: CreateWarehouseDto })
    @CommonApiResponses()
    @ApiCreateResponses(Warehouse)
    async create(@Body() createWarehouseDto: CreateWarehouseDto) {
        return await this.warehousesService.create(createWarehouseDto);
    }

    @Get()
    @ApiOperation({ summary: 'Retrieve all warehouses' })
    @CommonApiResponses()
    @ApiFindAllResponses(Warehouse)
    async findAll() {
        return await this.warehousesService.findAll();
    }

    @Get('/uuid')
    @ApiOperation({ summary: 'Retrieve a warehouse by UUID' })
    @ApiQuery({ name: 'uuid', required: true, type: String })
    @CommonApiResponses()
    @ApiFindOneResponse(Warehouse)
    async findOneByUuid(@Query('uuid', new ParseUUIDPipe()) uuid: string) {
        return await this.warehousesService.findOneByUuid(uuid);
    }

    @Get('/id')
    @ApiOperation({ summary: 'Retrieve a warehouse by ID' })
    @ApiQuery({ name: 'id', required: true, type: Number })
    @CommonApiResponses()
    @ApiFindOneResponse(Warehouse)
    async findOneById(@Query('id', new ParseIntPipe()) id: number) {
        return await this.warehousesService.findOneById(id);
    }

    @Patch()
    @ApiOperation({ summary: 'Update a warehouse by UUID' })
    @ApiQuery({ name: 'uuid', required: true, type: String })
    @ApiBody({ type: UpdateWarehouseDto })
    @CommonApiResponses()
    @ApiUpdateResponses(Warehouse)
    async update(@Query('uuid', new ParseUUIDPipe()) uuid: string, @Body() updateWarehouseDto: UpdateWarehouseDto) {
        return await this.warehousesService.update(uuid, updateWarehouseDto);
    }

    @Delete()
    @ApiOperation({ summary: 'Delete a warehouse by UUID' })
    @ApiQuery({ name: 'uuid', required: true, type: String })
    @CommonApiResponses()
    @ApiDeleteResponses(Warehouse)
    async remove(@Query('uuid', new ParseUUIDPipe()) uuid: string) {
        return await this.warehousesService.remove(uuid);
    }

    @Patch("/restore")
    @ApiOperation({ summary: 'Restore a deleted warehouse by UUID' })
    @ApiQuery({ name: 'uuid', required: true, type: String })
    @CommonApiResponses()
    @ApiUpdateResponses(Warehouse)
    async restore(@Query('uuid', new ParseUUIDPipe()) uuid: string) {
        return await this.warehousesService.restore(uuid);
    }
}
