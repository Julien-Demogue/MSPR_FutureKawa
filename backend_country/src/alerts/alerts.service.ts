import { BadRequestException, ConflictException, forwardRef, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Alert } from './alert.entity';
import { Repository } from 'typeorm';
import { CreateAlertDto } from './dto/create-alert.dto';
import { isNullOrEmpty, isValidId, isValidUuid } from '../utils/fields-validation.utils';
import { ApiResponseMessages } from '../utils/api-response-messages.utils';
import { UpdateAlertDto } from './dto/update-alert.dto';
import { v4 as uuidv4 } from 'uuid';
import { StatementsService } from '../statements/statements.service';
import { StatusesService } from '../statuses/statuses.service';

@Injectable()
export class AlertsService {
    constructor(@InjectRepository(Alert) private repo: Repository<Alert>,
        private statusesService: StatusesService,
        @Inject(forwardRef(() => StatementsService)) private statementsService: StatementsService
    ) { }

    async create(createAlertDto: CreateAlertDto) {
        if (isNullOrEmpty(createAlertDto.value)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('value'));
        }

        if (!isValidId(createAlertDto.id_statement)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('id_statement'));
        }

        if (!isValidId(createAlertDto.id_status)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('id_status'));
        }

        const statement = await this.statementsService.findOneById(createAlertDto.id_statement);
        if (!statement) {
            throw new BadRequestException(ApiResponseMessages.invalidField('id_statement'));
        }

        const status = await this.statusesService.findOneById(createAlertDto.id_status);
        if (!status) {
            throw new BadRequestException(ApiResponseMessages.invalidField('id_status'));
        }

        try {
            const uuid = uuidv4();
            const alert = this.repo.create({ ...createAlertDto, uuid });
            return await this.repo.save(alert);
        }
        catch (error) {
            throw new InternalServerErrorException(ApiResponseMessages.internalServerError(Alert, error));
        }
    }

    async findAll() {
        return await this.repo.find();
    }

    async findOneByUuid(uuid: string) {
        if (!isValidUuid(uuid)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('uuid'));
        }

        const alert = await this.repo.findOneBy({ uuid });
        if (!alert) {
            throw new BadRequestException(ApiResponseMessages.notFound(Alert));
        }
        return alert;
    }

    async findOneById(id: number) {
        if (!isValidId(id)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('id'));
        }

        const alert = await this.repo.findOneBy({ id });
        if (!alert) {
            throw new BadRequestException(ApiResponseMessages.notFound(Alert));
        }
        return alert;
    }

    async update(uuid: string, updateAlertDto: UpdateAlertDto) {
        if (!isValidUuid(uuid)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('uuid'));
        }

        if (updateAlertDto.value && isNullOrEmpty(updateAlertDto.value)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('value'));
        }

        if (updateAlertDto.id_statement !== undefined) {
            if (!isValidId(updateAlertDto.id_statement)) {
                throw new BadRequestException(ApiResponseMessages.invalidField('id_statement'));
            }

            const statement = await this.statementsService.findOneById(updateAlertDto.id_statement);
            if (!statement) {
                throw new BadRequestException(ApiResponseMessages.invalidField('id_statement'));
            }
        }

        if (updateAlertDto.id_status !== undefined) {
            if (!isValidId(updateAlertDto.id_status)) {
                throw new BadRequestException(ApiResponseMessages.invalidField('id_status'));
            }

            const status = await this.statusesService.findOneById(updateAlertDto.id_status);
            if (!status) {
                throw new BadRequestException(ApiResponseMessages.invalidField('id_status'));
            }
        }

        await this.findOneByUuid(uuid); // Ensure the alert exists before updating

        try {
            await this.repo.update({ uuid }, updateAlertDto);
            return await this.findOneByUuid(uuid);
        }
        catch (error) {
            throw new InternalServerErrorException(ApiResponseMessages.internalServerError(Alert, error));
        }
    }

    async remove(uuid: string) {
        if (!isValidUuid(uuid)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('uuid'));
        }

        await this.findOneByUuid(uuid); // Ensure the alert exists before deleting

        try {
            await this.repo.softDelete({ uuid });
            return;
        }
        catch (error) {
            throw new InternalServerErrorException(ApiResponseMessages.internalServerError(Alert, error));
        }
    }

    async restore(uuid: string) {
        if (!isValidUuid(uuid)) {
            throw new BadRequestException(ApiResponseMessages.invalidField('uuid'));
        }

        const existingAlert = await this.repo.findOneBy({ uuid });
        if (existingAlert) {
            throw new BadRequestException(ApiResponseMessages.cantRestoreExisting(Alert));
        }

        try {
            await this.repo.restore({ uuid });
            return this.findOneByUuid(uuid);
        }
        catch (error) {
            throw new InternalServerErrorException(ApiResponseMessages.internalServerError(Alert, error));
        }
    }
}
