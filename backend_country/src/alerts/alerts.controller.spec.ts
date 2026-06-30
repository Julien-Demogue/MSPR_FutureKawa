import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
import { Alert } from './alert.entity';
import { StatusesService } from '../statuses/statuses.service';
import { StatementsService } from '../statements/statements.service';
import { ServiceAuthGuard } from '../utils/guards/service-auth.guard';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';

// Isolated entity to bypass SQLite enum limitations and TypeORM relation cascading
@Entity('alerts')
class IsolatedTestAlert {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 36, unique: true })
  uuid!: string;

  @Column({ type: 'varchar', length: 255 })
  value!: string;

  @Column({ name: 'id_status' })
  id_status!: number;

  @Column({ name: 'id_statement' })
  id_statement!: number;

  @CreateDateColumn({ type: 'datetime' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at!: Date;

  @DeleteDateColumn({ type: 'datetime', nullable: true })
  deleted_at!: Date;
}

describe('Alerts Integration Test', () => {
  let app: INestApplication;
  let createdAlertUuid: string;
  let createdAlertId: number;

  const mockStatusId = 1;
  const mockStatementId = 1;

  const createAlertDto = {
    value: 'Critical Temperature Exceeded',
    id_status: mockStatusId,
    id_statement: mockStatementId,
  };

  beforeAll(async () => {
    const allowGuard = {
      canActivate: jest.fn(() => true),
    };

    const mockStatusesService = {
      findOneById: jest.fn().mockResolvedValue({ id: mockStatusId, value: 'ALERT' }),
    };

    const mockStatementsService = {
      findOneById: jest.fn().mockResolvedValue({ id: mockStatementId, type: 'TEMPERATURE' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [IsolatedTestAlert],
          synchronize: true,
          logging: false,
        }),
        TypeOrmModule.forFeature([IsolatedTestAlert]),
      ],
      controllers: [AlertsController],
      providers: [
        AlertsService,
        // Override the real Alert repository with our isolated fake entity
        {
          provide: getRepositoryToken(Alert),
          useExisting: getRepositoryToken(IsolatedTestAlert),
        },
        { provide: StatusesService, useValue: mockStatusesService },
        { provide: StatementsService, useValue: mockStatementsService },
      ],
    })
      .overrideGuard(ServiceAuthGuard)
      .useValue(allowGuard)
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /alerts should save an alert in database', async () => {
    const response = await request(app.getHttpServer())
      .post('/alerts')
      .send(createAlertDto);

    if (response.status !== 201) {
      console.error('POST /alerts failed payload check:', response.body);
    }

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('uuid');
    expect(response.body.value).toBe(createAlertDto.value);

    createdAlertUuid = response.body.uuid;
    createdAlertId = response.body.id;
  });

  it('GET /alerts should retrieve all alerts', async () => {
    const response = await request(app.getHttpServer())
      .get('/alerts');

    if (response.status !== 200) {
      console.error('GET /alerts failed:', response.body);
    }

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0].uuid).toBe(createdAlertUuid);
  });

  it('GET /alerts/uuid should retrieve alert by UUID', async () => {
    const response = await request(app.getHttpServer())
      .get('/alerts/uuid')
      .query({ uuid: createdAlertUuid });

    if (response.status !== 200) {
      console.error('GET /alerts/uuid failed:', response.body);
    }

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(createdAlertId);
  });

  it('GET /alerts/id should retrieve alert by ID', async () => {
    const response = await request(app.getHttpServer())
      .get('/alerts/id')
      .query({ id: createdAlertId });

    if (response.status !== 200) {
      console.error('GET /alerts/id failed:', response.body);
    }

    expect(response.status).toBe(200);
    expect(response.body.uuid).toBe(createdAlertUuid);
  });

  it('PATCH /alerts should update database entry', async () => {
    const response = await request(app.getHttpServer())
      .patch('/alerts')
      .query({ uuid: createdAlertUuid })
      .send({ value: 'Resolved Temperature Alert' });

    if (response.status !== 200) {
      console.error('PATCH /alerts failed:', response.body);
    }

    expect(response.status).toBe(200);
    expect(response.body.value).toBe('Resolved Temperature Alert');
  });

  it('DELETE /alerts should mark alert as deleted (soft delete)', async () => {
    const response = await request(app.getHttpServer())
      .delete('/alerts')
      .query({ uuid: createdAlertUuid });

    if (response.status !== 204) {
      console.error('DELETE /alerts failed:', response.body);
    }

    expect(response.status).toBe(204);
  });

  it('PATCH /alerts/restore should reactivate the alert', async () => {
    const response = await request(app.getHttpServer())
      .patch('/alerts/restore')
      .query({ uuid: createdAlertUuid });

    if (response.status !== 200) {
      console.error('PATCH /alerts/restore failed:', response.body);
    }

    expect(response.status).toBe(200);
    expect(response.body.deleted_at).toBeNull();
  });
});