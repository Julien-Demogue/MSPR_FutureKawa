import { Body, Controller, Delete, Get, ParseIntPipe, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CommonApiResponses } from '../utils/decorators/common-api-responses.decorator';
import { ApiCreateResponses } from '../utils/decorators/api-create-responses.decorator';
import { ApiFindAllResponses } from '../utils/decorators/api-find-all-response.decorator';
import { ApiFindOneResponse } from '../utils/decorators/api-find-one-responses.decorator';
import { ApiUpdateResponses } from '../utils/decorators/api-update-responses.decorator';
import { ApiDeleteResponses } from '../utils/decorators/api-delete-responses.decorator';
import { User } from './user.entity';
import { Permission, PermissionGuard } from '../utils/guards/permission.guard';
import { LoginGuard } from '../utils/guards/login.guard';
import { Permissions } from '../utils/constants/roles-permissions.constant';
import { JwtPayload } from '../utils/dto/jwt.dto';
import type { Request as ExpressRequest } from 'express';

@ApiTags('users')
@Controller('users')
export class UsersController {
    constructor(private usersService: UsersService) { }

    @UseGuards(LoginGuard, PermissionGuard)
    @Permission(Permissions.USERS_CREATE)
    @Post()
    @ApiOperation({ summary: 'Create a new user' })
    @ApiBody({ type: CreateUserDto })
    @CommonApiResponses()
    @ApiCreateResponses(User)
    async create(@Body() createUserDto: CreateUserDto) {
        return await this.usersService.create(createUserDto);
    }

    @UseGuards(LoginGuard, PermissionGuard)
    @Permission(Permissions.USERS_READ_ALL)
    @Get()
    @ApiOperation({ summary: 'Retrieve all users' })
    @CommonApiResponses()
    @ApiFindAllResponses(User)
    async findAll() {
        return await this.usersService.findAll();
    }

    @UseGuards(LoginGuard, PermissionGuard)
    @Permission(Permissions.USERS_READ_ME)
    @Get("/me")
    @ApiOperation({ summary: "Retrieve user by his UUID" })
    @ApiFindOneResponse(User)
    @CommonApiResponses()
    async findMe(@Req() req: ExpressRequest) {
        const { sub } = (req as ExpressRequest & { user: JwtPayload }).user;
        return await this.usersService.findOneByUuid(sub);
    }


    @Get('/uuid')
    @ApiOperation({ summary: 'Retrieve a user by UUID' })
    @ApiQuery({ name: 'uuid', required: true, type: String })
    @CommonApiResponses()
    @ApiFindOneResponse(User)
    async findOneByUuid(@Query('uuid', new ParseUUIDPipe()) uuid: string) {
        return await this.usersService.findOneByUuid(uuid);
    }

    @Get('/id')
    @ApiOperation({ summary: 'Retrieve a user by ID' })
    @ApiQuery({ name: 'id', required: true, type: Number })
    @CommonApiResponses()
    @ApiFindOneResponse(User)
    async findOneById(@Query('id', new ParseIntPipe()) id: number) {
        return await this.usersService.findOneById(id);
    }

    @Get('/email')
    @ApiOperation({ summary: 'Retrieve a user by email' })
    @ApiQuery({ name: 'email', required: true, type: String })
    @CommonApiResponses()
    @ApiFindOneResponse(User)
    async findOneByEmail(@Query('email') email: string) {
        return await this.usersService.findOneByEmail(email);
    }

    @Patch()
    @ApiOperation({ summary: 'Update a user by UUID' })
    @ApiQuery({ name: 'uuid', required: true, type: String })
    @ApiBody({ type: UpdateUserDto })
    @CommonApiResponses()
    @ApiUpdateResponses(User)
    async update(
        @Query('uuid', new ParseUUIDPipe()) uuid: string,
        @Body() updateUserDto: UpdateUserDto,
    ) {
        return await this.usersService.update(uuid, updateUserDto);
    }

    @Delete()
    @ApiOperation({ summary: 'Delete a user by UUID' })
    @ApiQuery({ name: 'uuid', required: true, type: String })
    @CommonApiResponses()
    @ApiDeleteResponses(User)
    async remove(@Query('uuid', new ParseUUIDPipe()) uuid: string) {
        return await this.usersService.remove(uuid);
    }

    @Patch('/restore')
    @ApiOperation({ summary: 'Restore a deleted user by UUID' })
    @ApiQuery({ name: 'uuid', required: true, type: String })
    @CommonApiResponses()
    @ApiUpdateResponses(User)
    async restore(@Query('uuid', new ParseUUIDPipe()) uuid: string) {
        return await this.usersService.restore(uuid);
    }
}
