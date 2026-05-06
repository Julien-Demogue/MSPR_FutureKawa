import { BadRequestException, ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Statement } from './statement.entity';
import { Repository } from 'typeorm';
import { CreateStatementDto } from './dto/create-statement.dto';
import { isNullOrEmpty, isValidId, isValidNumber, isValidPercent, isValidUuid } from '../utils/fields-validation.utils';
import { ApiResponseMessages } from '../utils/api-response-messages.utils';
import { UpdateStatementDto } from './dto/update-statement.dto';
import { v4 as uuidv4 } from 'uuid';
import { WarehousesService } from '../warehouses/warehouses.service';

@Injectable()
export class StatementsService {
    constructor(@InjectRepository(Statement) private repo: Repository<Statement>, private warehousesService: WarehousesService) { }

    async create(createStatementDto: CreateStatementDto) {
        if (!isValidNumber(createStatementDto.temperature)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('temperature'));
        }

        if (!isValidPercent(createStatementDto.humidity)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('humidity'));
        }

        if (!isValidId(createStatementDto.id_warehouse)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('id_warehouse'));
        }

        const warehouse = await this.warehousesService.findOneById(createStatementDto.id_warehouse);
        if (!warehouse) {
            throw new BadRequestException(ApiResponseMessages.invalidField('id_warehouse'));
        }

        try {
            const uuid = uuidv4();
            const statement = this.repo.create({ ...createStatementDto, uuid });
            return await this.repo.save(statement);
        }
        catch (error) {
            throw new InternalServerErrorException(ApiResponseMessages.internalServerError(Statement, error));
        }
    }

    async findAll() {
        return await this.repo.find();
    }

    async findOneByUuid(uuid: string) {
        if (!isValidUuid(uuid)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('uuid'));
        }

        const statement = await this.repo.findOneBy({ uuid });
        if (!statement) {
            throw new BadRequestException(ApiResponseMessages.notFound(Statement));
        }
        return statement;
    }

    async findOneById(id: number) {
        if (!isValidId(id)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('id'));
        }

        const statement = await this.repo.findOneBy({ id });
        if (!statement) {
            throw new BadRequestException(ApiResponseMessages.notFound(Statement));
        }
        return statement;
    }

    async update(uuid: string, updateStatementDto: UpdateStatementDto) {
        if (!isValidUuid(uuid)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('uuid'));
        }

        if (updateStatementDto.temperature !== undefined && !isValidNumber(updateStatementDto.temperature)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('temperature'));
        }

        if (updateStatementDto.humidity !== undefined && !isValidPercent(updateStatementDto.humidity)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('humidity'));
        }

        if (updateStatementDto.id_warehouse !== undefined) {
            if (!isValidId(updateStatementDto.id_warehouse)) {
                throw new BadRequestException(ApiResponseMessages.invalidField('id_warehouse'));
            }

            const warehouse = await this.warehousesService.findOneById(updateStatementDto.id_warehouse);
            if (!warehouse) {
                throw new BadRequestException(ApiResponseMessages.invalidField('id_warehouse'));
            }
        }

        await this.findOneByUuid(uuid); // Ensure the statement exists before updating

        try {
            await this.repo.update({ uuid }, updateStatementDto);
            return await this.findOneByUuid(uuid);
        }
        catch (error) {
            throw new InternalServerErrorException(ApiResponseMessages.internalServerError(Statement, error));
        }
    }

    async remove(uuid: string) {
        if (!isValidUuid(uuid)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('uuid'));
        }

        await this.findOneByUuid(uuid); // Ensure the statement exists before deleting

        try {
            await this.repo.softDelete({ uuid });
            return;
        }
        catch (error) {
            throw new InternalServerErrorException(ApiResponseMessages.internalServerError(Statement, error));
        }
    }

    async restore(uuid: string) {
        if (!isValidUuid(uuid)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('uuid'));
        }

        const existingStatement = await this.repo.findOneBy({ uuid });
        if (existingStatement) {
            throw new BadRequestException(ApiResponseMessages.cantRestoreExisting(Statement));
        }

        try {
            await this.repo.restore({ uuid });
            return this.findOneByUuid(uuid);
        }
        catch (error) {
            throw new InternalServerErrorException(ApiResponseMessages.internalServerError(Statement, error));
        }
    }
}
