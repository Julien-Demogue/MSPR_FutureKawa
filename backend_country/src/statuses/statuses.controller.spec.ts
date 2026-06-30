import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { StatusesController } from './statuses.controller';
import { StatusesService } from './statuses.service';
import { Status } from './status.entity';
import { BatchesService } from '../batches/batches.service';
import { ServiceAuthGuard } from '../utils/guards/service-auth.guard';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';

// Isolated entity to bypass SQLite enum limitations and TypeORM relation cascading
@Entity('statuses')
class IsolatedTestStatus {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 36, unique: true })
  uuid!: string;

  // Changed to varchar to bypass strict enum checks in sqlite tests
  @Column({ type: 'varchar', length: 50 })
  value!: string;

  @Column({ name: 'id_batch' })
  id_batch!: number;

  @CreateDateColumn({ type: 'datetime' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at!: Date;

  @DeleteDateColumn({ type: 'datetime', nullable: true })
  deleted_at!: Date;
}

describe('Statuses Integration Test', () => {
  let app: INestApplication;
  let createdStatusUuid: string;
  let createdStatusId: number;

  const mockBatchId = 1;

  const createStatusDto = {
    value: 'OK',
    id_batch: mockBatchId,
  };

  beforeAll(async () => {
    const allowGuard = {
      canActivate: jest.fn(() => true),
    };

    // Mocking dependent service to isolate Statuses validation
    const mockBatchesService = {
      findOneById: jest.fn().mockResolvedValue({ id: mockBatchId }),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [IsolatedTestStatus],
          synchronize: true,
          logging: false,
        }),
        TypeOrmModule.forFeature([IsolatedTestStatus]),
      ],
      controllers: [StatusesController],
      providers: [
        StatusesService,
        {
          provide: getRepositoryToken(Status),
          useExisting: getRepositoryToken(IsolatedTestStatus),
        },
        { provide: BatchesService, useValue: mockBatchesService },
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

  it('POST /statuses should save a status in database', async () => {
    const response = await request(app.getHttpServer())
      .post('/statuses')
      .send(createStatusDto);

    if (response.status !== 201) {
      console.error('POST /statuses failed payload check:', response.body);
    }

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('uuid');
    expect(response.body.value).toBe(createStatusDto.value);

    createdStatusUuid = response.body.uuid;
    createdStatusId = response.body.id;
  });

  it('GET /statuses should retrieve all statuses', async () => {
    const response = await request(app.getHttpServer())
      .get('/statuses');

    if (response.status !== 200) {
      console.error('GET /statuses failed:', response.body);
    }

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0].uuid).toBe(createdStatusUuid);
  });

  it('GET /statuses/value should retrieve statuses by specific value', async () => {
    const response = await request(app.getHttpServer())
      .get('/statuses/value')
      .query({ value: 'OK' });

    if (response.status !== 200) {
      console.error('GET /statuses/value failed:', response.body);
    }

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0].value).toBe('OK');
  });

  it('GET /statuses/uuid should retrieve status by UUID', async () => {
    const response = await request(app.getHttpServer())
      .get('/statuses/uuid')
      .query({ uuid: createdStatusUuid });

    if (response.status !== 200) {
      console.error('GET /statuses/uuid failed:', response.body);
    }

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(createdStatusId);
  });

  it('GET /statuses/id should retrieve status by ID', async () => {
    const response = await request(app.getHttpServer())
      .get('/statuses/id')
      .query({ id: createdStatusId });

    if (response.status !== 200) {
      console.error('GET /statuses/id failed:', response.body);
    }

    expect(response.status).toBe(200);
    expect(response.body.uuid).toBe(createdStatusUuid);
  });

  it('PATCH /statuses should update database entry', async () => {
    const response = await request(app.getHttpServer())
      .patch('/statuses')
      .query({ uuid: createdStatusUuid })
      .send({ value: 'ALERT' });

    if (response.status !== 200) {
      console.error('PATCH /statuses failed:', response.body);
    }

    expect(response.status).toBe(200);
    expect(response.body.value).toBe('ALERT');
  });

  it('DELETE /statuses should mark status as deleted (soft delete)', async () => {
    const response = await request(app.getHttpServer())
      .delete('/statuses')
      .query({ uuid: createdStatusUuid });

    if (response.status !== 204) {
      console.error('DELETE /statuses failed:', response.body);
    }

    expect(response.status).toBe(204);
  });

  it('PATCH /statuses/restore should reactivate the status', async () => {
    const response = await request(app.getHttpServer())
      .patch('/statuses/restore')
      .query({ uuid: createdStatusUuid });

    if (response.status !== 200) {
      console.error('PATCH /statuses/restore failed:', response.body);
    }

    expect(response.status).toBe(200);
    expect(response.body.deleted_at).toBeNull();
  });
});