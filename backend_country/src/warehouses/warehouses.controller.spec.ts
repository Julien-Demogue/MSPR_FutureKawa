import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { WarehousesController } from './warehouses.controller';
import { WarehousesService } from './warehouses.service';
import { Warehouse } from './warehouse.entity';
import { FarmsService } from '../farms/farms.service';
import { ServiceAuthGuard } from '../utils/guards/service-auth.guard';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';

// --- FAKE ENTITIES TO SATISFY TYPEORM RELATIONS ---
@Entity('test_countries')
class TestCountry { @PrimaryGeneratedColumn() id!: number; }

@Entity('test_farms')
class TestFarm {
  @PrimaryGeneratedColumn() id!: number;

  @ManyToOne(() => TestCountry, { createForeignKeyConstraints: false })
  country!: TestCountry;
}

@Entity('test_statuses')
class TestStatus {
  @PrimaryGeneratedColumn() id!: number;

  @ManyToOne('TestBatch', 'statuses', { createForeignKeyConstraints: false })
  batch!: any;
}

@Entity('test_batches')
class TestBatch {
  @PrimaryGeneratedColumn() id!: number;

  @ManyToOne('IsolatedTestWarehouse', 'batches', { createForeignKeyConstraints: false })
  warehouse!: any;

  @OneToMany(() => TestStatus, s => s.batch)
  statuses!: TestStatus[];
}

// --- MAIN ISOLATED ENTITY ---
@Entity('warehouses')
class IsolatedTestWarehouse {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 36, unique: true })
  uuid!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ name: 'id_farm' })
  id_farm!: number;

  @CreateDateColumn({ type: 'datetime' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at!: Date;

  @DeleteDateColumn({ type: 'datetime', nullable: true })
  deleted_at!: Date;

  // Satisfies relations WITHOUT triggering SQLite physical Foreign Key errors
  @ManyToOne(() => TestFarm, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'id_farm' })
  farm!: TestFarm;

  // Satisfies 'batches' and 'batches.statuses' relations
  @OneToMany(() => TestBatch, b => b.warehouse)
  batches!: TestBatch[];
}

describe('Warehouses Integration Test', () => {
  let app: INestApplication;
  let createdWarehouseUuid: string;
  let createdWarehouseId: number;

  const mockFarmId = 1;

  const createWarehouseDto = {
    name: 'Main Storage Alpha',
    id_farm: mockFarmId,
  };

  beforeAll(async () => {
    const allowGuard = {
      canActivate: jest.fn(() => true),
    };

    // Mocking dependent service to isolate Warehouses validation
    const mockFarmsService = {
      findOneById: jest.fn().mockResolvedValue({ id: mockFarmId, name: 'Test Farm' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [IsolatedTestWarehouse, TestFarm, TestCountry, TestBatch, TestStatus],
          synchronize: true,
          logging: false,
        }),
        TypeOrmModule.forFeature([IsolatedTestWarehouse]),
      ],
      controllers: [WarehousesController],
      providers: [
        WarehousesService,
        {
          provide: getRepositoryToken(Warehouse),
          useExisting: getRepositoryToken(IsolatedTestWarehouse),
        },
        { provide: FarmsService, useValue: mockFarmsService },
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
    if (app) {
      await app.close();
    }
  });

  it('POST /warehouses should save a warehouse in database', async () => {
    const response = await request(app.getHttpServer())
      .post('/warehouses')
      .send(createWarehouseDto);

    if (response.status !== 201) {
      console.error('POST /warehouses failed payload check:', response.body);
    }

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('uuid');
    expect(response.body.name).toBe(createWarehouseDto.name);

    createdWarehouseUuid = response.body.uuid;
    createdWarehouseId = response.body.id;
  });

  it('GET /warehouses should retrieve all warehouses', async () => {
    const response = await request(app.getHttpServer())
      .get('/warehouses');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0].uuid).toBe(createdWarehouseUuid);
  });

  it('GET /warehouses/uuid should retrieve warehouse by UUID', async () => {
    const response = await request(app.getHttpServer())
      .get('/warehouses/uuid')
      .query({ uuid: createdWarehouseUuid });

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(createdWarehouseId);
  });

  it('GET /warehouses/id should retrieve warehouse by ID', async () => {
    const response = await request(app.getHttpServer())
      .get('/warehouses/id')
      .query({ id: createdWarehouseId });

    expect(response.status).toBe(200);
    expect(response.body.uuid).toBe(createdWarehouseUuid);
  });

  it('PATCH /warehouses should update database entry', async () => {
    const response = await request(app.getHttpServer())
      .patch('/warehouses')
      .query({ uuid: createdWarehouseUuid })
      .send({ name: 'Storage Beta Updated' });

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Storage Beta Updated');
  });

  it('DELETE /warehouses should mark warehouse as deleted (soft delete)', async () => {
    const response = await request(app.getHttpServer())
      .delete('/warehouses')
      .query({ uuid: createdWarehouseUuid });

    expect(response.status).toBe(204);
  });

  it('PATCH /warehouses/restore should reactivate the warehouse', async () => {
    const response = await request(app.getHttpServer())
      .patch('/warehouses/restore')
      .query({ uuid: createdWarehouseUuid });

    expect(response.status).toBe(200);
    expect(response.body.deleted_at).toBeNull();
  });
});