import { Body, Controller, Delete, Get, ParseIntPipe, ParseUUIDPipe, Patch, Post, Query, } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { CommonApiResponses } from '../utils/decorators/common-api-responses.decorator';
import { ApiCreateResponses } from '../utils/decorators/api-create-responses.decorator';
import { ApiFindAllResponses } from '../utils/decorators/api-find-all-response.decorator';
import { ApiFindOneResponse } from '../utils/decorators/api-find-one-responses.decorator';
import { ApiUpdateResponses } from '../utils/decorators/api-update-responses.decorator';
import { ApiDeleteResponses } from '../utils/decorators/api-delete-responses.decorator';
import { Role } from './role.entity';
import { Guard } from '../utils/decorators/guard.decorator';
import { AppRole } from '../utils/constants/roles.constant';

@ApiTags('roles')
@Controller('roles')
export class RolesController {
    constructor(private rolesService: RolesService) { }

    @Guard(AppRole.SUPERADMIN)
    @Post()
    @ApiOperation({ summary: 'Create a new role' })
    @ApiBody({ type: CreateRoleDto })
    @CommonApiResponses()
    @ApiCreateResponses(Role)
    async create(@Body() createRoleDto: CreateRoleDto) {
        return await this.rolesService.create(createRoleDto);
    }

    @Guard(AppRole.SUPERADMIN, AppRole.ADMIN)
    @Get()
    @ApiOperation({ summary: 'Retrieve all roles' })
    @CommonApiResponses()
    @ApiFindAllResponses(Role)
    async findAll() {
        return await this.rolesService.findAll();
    }

    @Guard(AppRole.SUPERADMIN, AppRole.ADMIN)
    @Get('/uuid')
    @ApiOperation({ summary: 'Retrieve a role by UUID' })
    @ApiQuery({ name: 'uuid', required: true, type: String })
    @CommonApiResponses()
    @ApiFindOneResponse(Role)
    async findOneByUuid(@Query('uuid', new ParseUUIDPipe()) uuid: string) {
        return await this.rolesService.findOneByUuid(uuid);
    }

    @Guard(AppRole.SUPERADMIN, AppRole.ADMIN)
    @Get('/id')
    @ApiOperation({ summary: 'Retrieve a role by ID' })
    @ApiQuery({ name: 'id', required: true, type: Number })
    @CommonApiResponses()
    @ApiFindOneResponse(Role)
    async findOneById(@Query('id', new ParseIntPipe()) id: number) {
        return await this.rolesService.findOneById(id);
    }

    @Guard(AppRole.SUPERADMIN, AppRole.ADMIN)
    @Get('/label')
    @ApiOperation({ summary: 'Retrieve a role by label' })
    @ApiQuery({ name: 'label', required: true, type: String })
    @CommonApiResponses()
    @ApiFindOneResponse(Role)
    async findOneByLabel(@Query('label') label: string) {
        return await this.rolesService.findOneByLabel(label);
    }

    @Guard(AppRole.SUPERADMIN)
    @Patch()
    @ApiOperation({ summary: 'Update a role by UUID' })
    @ApiQuery({ name: 'uuid', required: true, type: String })
    @ApiBody({ type: UpdateRoleDto })
    @CommonApiResponses()
    @ApiUpdateResponses(Role)
    async update(
        @Query('uuid', new ParseUUIDPipe()) uuid: string,
        @Body() updateRoleDto: UpdateRoleDto,
    ) {
        return await this.rolesService.update(uuid, updateRoleDto);
    }

    @Guard(AppRole.SUPERADMIN)
    @Delete()
    @ApiOperation({ summary: 'Delete a role by UUID' })
    @ApiQuery({ name: 'uuid', required: true, type: String })
    @CommonApiResponses()
    @ApiDeleteResponses(Role)
    async remove(@Query('uuid', new ParseUUIDPipe()) uuid: string) {
        return await this.rolesService.remove(uuid);
    }

    @Guard(AppRole.SUPERADMIN)
    @Patch('/restore')
    @ApiOperation({ summary: 'Restore a deleted role by UUID' })
    @ApiQuery({ name: 'uuid', required: true, type: String })
    @CommonApiResponses()
    @ApiUpdateResponses(Role)
    async restore(@Query('uuid', new ParseUUIDPipe()) uuid: string) {
        return await this.rolesService.restore(uuid);
    }
}
