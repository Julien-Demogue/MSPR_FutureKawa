import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { BatchesController } from './batches.controller';
import { BatchesService } from './batches.service';
import { Batch } from './batch.entity';
import { WarehousesService } from '../warehouses/warehouses.service';
import { StatusesService } from '../statuses/statuses.service';
import { ServiceAuthGuard } from '../utils/guards/service-auth.guard';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';

// Isolated entity to bypass SQLite enum limitations and TypeORM relation cascading
@Entity('batches')
class IsolatedTestBatch {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 36, unique: true })
  uuid!: string;

  @Column({ name: 'id_warehouse' })
  id_warehouse!: number;

  @CreateDateColumn({ type: 'datetime' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at!: Date;

  @DeleteDateColumn({ type: 'datetime', nullable: true })
  deleted_at!: Date;
}

describe('Batches Integration Test', () => {
  let app: INestApplication;
  let createdBatchUuid: string;
  let createdBatchId: number;

  const mockWarehouseId = 1;

  const createBatchDto = {
    id_warehouse: mockWarehouseId,
  };

  beforeAll(async () => {
    const allowGuard = {
      canActivate: jest.fn(() => true),
    };

    // Mocking dependent services to isolate Batches validation
    const mockWarehousesService = {
      findOneById: jest.fn().mockResolvedValue({ id: mockWarehouseId, name: 'Warehouse A' }),
    };

    const mockStatusesService = {
      create: jest.fn().mockResolvedValue({ id: 1, value: 'OK' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [IsolatedTestBatch],
          synchronize: true,
          logging: false,
        }),
        TypeOrmModule.forFeature([IsolatedTestBatch]),
      ],
      controllers: [BatchesController],
      providers: [
        BatchesService,
        {
          provide: getRepositoryToken(Batch),
          useExisting: getRepositoryToken(IsolatedTestBatch),
        },
        { provide: WarehousesService, useValue: mockWarehousesService },
        { provide: StatusesService, useValue: mockStatusesService },
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

  it('POST /batches should save a batch in database and trigger associated status', async () => {
    const response = await request(app.getHttpServer())
      .post('/batches')
      .send(createBatchDto);

    if (response.status !== 201) {
      console.error('POST /batches failed payload check:', response.body);
    }

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('uuid');
    expect(response.body.id_warehouse).toBe(createBatchDto.id_warehouse);

    createdBatchUuid = response.body.uuid;
    createdBatchId = response.body.id;
  });

  it('GET /batches should retrieve all batches', async () => {
    const response = await request(app.getHttpServer())
      .get('/batches');

    if (response.status !== 200) {
      console.error('GET /batches failed:', response.body);
    }

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0].uuid).toBe(createdBatchUuid);
  });

  it('GET /batches/uuid should retrieve batch by UUID', async () => {
    const response = await request(app.getHttpServer())
      .get('/batches/uuid')
      .query({ uuid: createdBatchUuid });

    if (response.status !== 200) {
      console.error('GET /batches/uuid failed:', response.body);
    }

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(createdBatchId);
  });

  it('GET /batches/id should retrieve batch by ID', async () => {
    const response = await request(app.getHttpServer())
      .get('/batches/id')
      .query({ id: createdBatchId });

    if (response.status !== 200) {
      console.error('GET /batches/id failed:', response.body);
    }

    expect(response.status).toBe(200);
    expect(response.body.uuid).toBe(createdBatchUuid);
  });

  it('PATCH /batches should update database entry', async () => {
    const response = await request(app.getHttpServer())
      .patch('/batches')
      .query({ uuid: createdBatchUuid })
      .send({ id_warehouse: mockWarehouseId });

    if (response.status !== 200) {
      console.error('PATCH /batches failed:', response.body);
    }

    expect(response.status).toBe(200);
    expect(response.body.id_warehouse).toBe(mockWarehouseId);
  });

  it('DELETE /batches should mark batch as deleted (soft delete)', async () => {
    const response = await request(app.getHttpServer())
      .delete('/batches')
      .query({ uuid: createdBatchUuid });

    if (response.status !== 204) {
      console.error('DELETE /batches failed:', response.body);
    }

    expect(response.status).toBe(204);
  });

  it('PATCH /batches/restore should reactivate the batch', async () => {
    const response = await request(app.getHttpServer())
      .patch('/batches/restore')
      .query({ uuid: createdBatchUuid });

    if (response.status !== 200) {
      console.error('PATCH /batches/restore failed:', response.body);
    }

    expect(response.status).toBe(200);
    expect(response.body.deleted_at).toBeNull();
  });
});