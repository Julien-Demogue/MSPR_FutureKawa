import { Body, Controller, Delete, Get, HttpCode, ParseIntPipe, ParseUUIDPipe, Patch, Post, Query, Res } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { FarmsService } from './farms.service';
import { CreateFarmDto } from './dto/create-farm.dto';
import { UpdateFarmDto } from './dto/update-farm.dto';
import { CommonApiResponses } from '../utils/decorators/common-api-responses.decorator';
import { ApiCreateResponses } from '../utils/decorators/api-create-responses.decorator';
import { Farm } from './farm.entity';
import { ApiFindAllResponses } from '../utils/decorators/api-find-all-response.decorator';
import { ApiFindOneResponse } from '../utils/decorators/api-find-one-responses.decorator';
import { ApiUpdateResponses } from '../utils/decorators/api-update-responses.decorator';
import { ApiDeleteResponses } from '../utils/decorators/api-delete-responses.decorator';

@ApiTags('farms')
@Controller('farms')
export class FarmsController {
    constructor(private farmsService: FarmsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new farm' })
    @ApiBody({ type: CreateFarmDto })
    @CommonApiResponses()
    @ApiCreateResponses(Farm)
    async create(@Body() createFarmDto: CreateFarmDto) {
        return await this.farmsService.create(createFarmDto);
    }

    @Get()
    @ApiOperation({ summary: 'Retrieve all farms' })
    @CommonApiResponses()
    @ApiFindAllResponses(Farm)
    async findAll() {
        return await this.farmsService.findAll();
    }

    @Get('/uuid')
    @ApiOperation({ summary: 'Retrieve a farm by UUID' })
    @ApiQuery({ name: 'uuid', required: true, type: String })
    @CommonApiResponses()
    @ApiFindOneResponse(Farm)
    async findOneByUuid(@Query('uuid', new ParseUUIDPipe()) uuid: string) {
        return await this.farmsService.findOneByUuid(uuid);
    }

    @Get('/id')
    @ApiOperation({ summary: 'Retrieve a farm by ID' })
    @ApiQuery({ name: 'id', required: true, type: Number })
    @CommonApiResponses()
    @ApiFindOneResponse(Farm)
    async findOneById(@Query('id', new ParseIntPipe()) id: number) {
        return await this.farmsService.findOneById(id);
    }

    @Patch()
    @ApiOperation({ summary: 'Update a farm by UUID' })
    @ApiQuery({ name: 'uuid', required: true, type: String })
    @ApiBody({ type: UpdateFarmDto })
    @CommonApiResponses()
    @ApiUpdateResponses(Farm)
    async update(@Query('uuid', new ParseUUIDPipe()) uuid: string, @Body() updateFarmDto: UpdateFarmDto) {
        return await this.farmsService.update(uuid, updateFarmDto);
    }

    @Delete()
    @ApiOperation({ summary: 'Delete a farm by UUID' })
    @ApiQuery({ name: 'uuid', required: true, type: String })
    @CommonApiResponses()
    @ApiDeleteResponses(Farm)
    async remove(@Query('uuid', new ParseUUIDPipe()) uuid: string) {
        return await this.farmsService.remove(uuid);
    }

    @Patch("/restore")
    @ApiOperation({ summary: 'Restore a deleted farm by UUID' })
    @ApiQuery({ name: 'uuid', required: true, type: String })
    @CommonApiResponses()
    @ApiUpdateResponses(Farm)
    async restore(@Query('uuid', new ParseUUIDPipe()) uuid: string) {
        return await this.farmsService.restore(uuid);
    }
}
