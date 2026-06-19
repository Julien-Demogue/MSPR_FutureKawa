import { BadRequestException, ConflictException, forwardRef, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Statement } from './statement.entity';
import { Repository } from 'typeorm';
import { CreateStatementDto } from './dto/create-statement.dto';
import { isValidId, isValidNumber, isValidPercent, isValidUuid } from '../utils/fields-validation.utils';
import { ApiResponseMessages } from '../utils/api-response-messages.utils';
import { UpdateStatementDto } from './dto/update-statement.dto';
import { v4 as uuidv4 } from 'uuid';
import { WarehousesService } from '../warehouses/warehouses.service';
import { AlertsService } from '../alerts/alerts.service';
import { sendEmail } from '../utils/email.utils';
import { Warehouse } from '../warehouses/warehouse.entity';
import { StatusesService } from '../statuses/statuses.service';

@Injectable()
export class StatementsService {
    constructor(
        @InjectRepository(Statement) private repo: Repository<Statement>,
        private warehousesService: WarehousesService,
        @Inject(forwardRef(() => AlertsService)) private alertsService: AlertsService,
        private statusService: StatusesService
    ) { }
    metricTypes = ['TEMPERATURE', 'HUMIDITY'];

    async sendAlertOnTemperatureOrHumidityOutOfRange(statement: Statement, warehouse: Warehouse) {
        const country = warehouse.farm.country;

        const tempIdeal = Number(country.temperature_ideal);
        const tempTolerance = Number(country.temperature_tolerance_degrees);
        const maxTemp = tempIdeal + tempTolerance;
        const minTemp = tempIdeal - tempTolerance;

        const humidityIdeal = Number(country.humidity_ideal);
        const humidityTolerance = Number(country.humidity_tolerance_percents);
        const maxHumidity = humidityIdeal + humidityTolerance;
        const minHumidity = humidityIdeal - humidityTolerance;

        const value = Number(statement.value);

        let haveAlert = false;
        if (statement.type === 'TEMPERATURE' && (value < minTemp || value > maxTemp)) {
            haveAlert = true;
            const subject = 'Temperature Alert';
            const message = `<p>The temperature of the warehouse ${warehouse.name} in ${country.name} is out of range.` +
                ` Current temperature: ${value}°C. Ideal range: ${minTemp}°C - ${maxTemp}°C.</p>`;

            await sendEmail(
                'support.futurekawa@gmail.com', // Replace with the actual recipient email address
                subject,
                `<p>${message}</p>`
            );

            // Create alerts in the database for the temperature issue
            for (const batch of warehouse.batches) {
                for (const status of batch.statuses) {
                    if (status.value === 'OK') { // Only create alerts for statuses that are currently OK
                        await this.statusService.create({ value: 'ALERT', id_batch: batch.id });
                        await this.alertsService.create({
                            value: message,
                            id_status: status.id,
                            id_statement: statement.id
                        });
                    }
                }
            }
        }

        if (statement.type === 'HUMIDITY' && (value < minHumidity || value > maxHumidity)) {
            haveAlert = true;
            const subject = 'Humidity Alert';
            const message = `<p>The humidity of the warehouse ${warehouse.name} in ${country.name} is out of range.` +
                ` Current humidity: ${value}%. Ideal range: ${minHumidity}% - ${maxHumidity}%.</p>`;

            await sendEmail(
                'support.futurekawa@gmail.com', // Replace with the actual recipient email address
                subject,
                `<p>${message}</p>`
            );

            // Create alerts in the database for the humidity issue
            for (const batch of warehouse.batches) {
                for (const status of batch.statuses) {
                    if (status.value === 'OK') { // Only create alerts for statuses that are currently OK
                        await this.statusService.create({ value: 'ALERT', id_batch: batch.id });
                        await this.alertsService.create({
                            value: message,
                            id_status: status.id,
                            id_statement: statement.id
                        });
                    }
                }
            }
        }

        if (!haveAlert) {
            // Set alerts back to OK
            for (const batch of warehouse.batches) {
                for (const status of batch.statuses) {
                    if (status.value === 'ALERT') {
                        await this.statusService.create({ value: 'OK', id_batch: batch.id });
                    }
                }
            }
        }
    }


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
            const savedStatement = await this.repo.save(statement);

            await this.sendAlertOnTemperatureOrHumidityOutOfRange(statement, warehouse);

            return savedStatement;
        }
        catch (error) {
            throw new InternalServerErrorException(ApiResponseMessages.internalServerError(Statement, error));
        }
    }

    async findAll() {
        return await this.repo.find();
    }

    async findAllByType(type: string) {
        if (!this.metricTypes.includes(type)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('type'));
        }
        return await this.repo.findBy({ type });
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
