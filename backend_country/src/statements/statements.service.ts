import { BadRequestException, ConflictException, forwardRef, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Statement } from './statement.entity';
import { Repository } from 'typeorm';
import { CreateStatementDto } from './dto/create-statement.dto';
import { isNullOrEmpty, isValidId, isValidNumber, isValidPercent, isValidTimestamp, isValidUuid } from '../utils/fields-validation.utils';
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
    private metricTypes = ['TEMPERATURE', 'HUMIDITY'];
    private lastEmailSentTimes: Map<string, number> = new Map(); // Timestamp of the last email sent for each type of alert
    private lastAlertCreatedTimes: Map<string, number> = new Map(); // Timestamp of the last alert created for each type of alert
    private currentMetricStates: Map<string, boolean> = new Map();

    async sendAlertOnTemperatureOrHumidityOutOfRange(statement: Statement, warehouse: Warehouse) {
        const now = Date.now();
        const emailCooldown = 10 * 60 * 1000; // 10 minutes
        const alertCooldown = 1 * 60 * 1000; // 1 minute

        const country = warehouse.farm.country;
        const value = Number(statement.value);

        let isOutOfRange = false;
        let subject = '';
        let message = '';

        if (statement.type === 'TEMPERATURE') {
            const tempIdeal = Number(country.temperature_ideal);
            const tempTolerance = Number(country.temperature_tolerance_degrees);
            const maxTemp = tempIdeal + tempTolerance;
            const minTemp = tempIdeal - tempTolerance;

            if (value < minTemp || value > maxTemp) {
                isOutOfRange = true;
                subject = 'Temperature Alert';
                message = `The temperature of the warehouse ${warehouse.name} in ${country.name} is out of range. Current temperature: ${value}°C. Ideal range: ${minTemp}°C - ${maxTemp}°C.`;
            }
        } else if (statement.type === 'HUMIDITY') {
            const humidityIdeal = Number(country.humidity_ideal);
            const humidityTolerance = Number(country.humidity_tolerance_percents);
            const maxHumidity = humidityIdeal + humidityTolerance;
            const minHumidity = humidityIdeal - humidityTolerance;

            if (value < minHumidity || value > maxHumidity) {
                isOutOfRange = true;
                subject = 'Humidity Alert';
                message = `The humidity of the warehouse ${warehouse.name} in ${country.name} is out of range. Current humidity: ${value}%. Ideal range: ${minHumidity}% - ${maxHumidity}%.`;
            }
        }

        const cacheKey = `${warehouse.id}-${statement.type}`; // Unique key for each warehouse and metric type
        this.currentMetricStates.set(cacheKey, isOutOfRange);

        if (isOutOfRange) {
            const lastEmailTime = this.lastEmailSentTimes.get(cacheKey) || 0;
            if ((now - lastEmailTime) >= emailCooldown) {
                this.lastEmailSentTimes.set(cacheKey, now);
                await sendEmail('support.futurekawa@gmail.com', subject, `<p>${message}</p>`);
            }

            const lastAlertTime = this.lastAlertCreatedTimes.get(cacheKey) || 0;
            if ((now - lastAlertTime) >= alertCooldown) {
                this.lastAlertCreatedTimes.set(cacheKey, now);

                for (const batch of warehouse.batches) {
                    const latestStatus = batch.statuses?.length
                        ? [...batch.statuses].sort((a, b) => b.id - a.id)[0]
                        : null;

                    if (!latestStatus || latestStatus.value === 'OK') {
                        const newStatus = await this.statusService.create({ value: 'ALERT', id_batch: batch.id });
                        await this.alertsService.create({
                            value: message,
                            id_status: newStatus.id,
                            id_statement: statement.id
                        });
                    }
                }
            }
        } else {
            // Reset the state for this metric type
            this.currentMetricStates.delete(cacheKey);

            const otherType = statement.type === 'TEMPERATURE' ? 'HUMIDITY' : 'TEMPERATURE';
            const otherCacheKey = `${warehouse.id}-${otherType}`;
            const isOtherMetricBad = this.currentMetricStates.get(otherCacheKey) || false;

            if (!isOtherMetricBad) {
                for (const batch of warehouse.batches) {
                    const latestStatus = batch.statuses?.length
                        ? [...batch.statuses].sort((a, b) => b.id - a.id)[0]
                        : null;

                    if (latestStatus && latestStatus.value === 'ALERT') {
                        await this.statusService.create({ value: 'OK', id_batch: batch.id });
                    }
                }
            }
        }
    }

    async create(createStatementDto: CreateStatementDto) {
        if (!isValidNumber(createStatementDto.value)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('value'));
        }

        if (isNullOrEmpty(createStatementDto.type) || !this.metricTypes.includes(createStatementDto.type)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('type'));
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
            console.error('Failed to create statement:', error);
            throw new InternalServerErrorException(ApiResponseMessages.internalServerError(Statement, error));
        }
    }

    async findAll(offset: number = 0, count: number = 100) {
        const skip = isNaN(offset) || offset < 0 ? 0 : offset;
        const take = isNaN(count) || count < 1 ? 100 : count;

        return await this.repo.find({
            skip,
            take,
            order: { created_at: 'DESC' }
        });
    }

    async findAllByType(type: string, offset: number = 0, count: number = 100) {
        if (!this.metricTypes.includes(type)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('type'));
        }

        const skip = isNaN(offset) || offset < 0 ? 0 : offset;
        const take = isNaN(count) || count < 1 ? 100 : count;

        return await this.repo.find({
            where: { type },
            skip,
            take,
            order: { created_at: 'DESC' }
        });
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

        if (updateStatementDto.value !== undefined && !isValidNumber(updateStatementDto.value)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('value'));
        }

        if (updateStatementDto.type !== undefined && (isNullOrEmpty(updateStatementDto.type) || !this.metricTypes.includes(updateStatementDto.type))) {
            throw new BadRequestException(ApiResponseMessages.invalidField('type'));
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

        await this.findOneByUuid(uuid);

        try {
            await this.repo.update({ uuid }, updateStatementDto);
            return await this.findOneByUuid(uuid);
        }
        catch (error) {
            console.error('Failed to update statement:', error);
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