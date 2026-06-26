import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { StatementsController } from './statements.controller';
import { StatementsService } from './statements.service';
import { Statement } from './statement.entity';
import { ServiceAuthGuard } from '../utils/guards/service-auth.guard';
import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';
import { WarehousesService } from '../warehouses/warehouses.service';
import { AlertsService } from '../alerts/alerts.service';
import { StatusesService } from '../statuses/statuses.service';

// Isolated entity to bypass relation cascading and SQLite driver issues
@Entity('statements')
class IsolatedTestStatement {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 36, unique: true })
  uuid!: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  value!: number;

  @Column({ type: 'varchar', length: 255 })
  type!: string;

  @Column({ name: 'id_warehouse' })
  id_warehouse!: number;

  @CreateDateColumn({ type: 'datetime' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at!: Date;

  @DeleteDateColumn({ type: 'datetime', nullable: true })
  deleted_at!: Date;
}

describe('Statements Integration Test', () => {
  let app: INestApplication;
  let createdStatementUuid: string;
  let createdStatementId: number;

  // On passe la valeur en String pour satisfaire le @IsDecimal() de votre DTO
  const createStatementDto = {
    value: '22.50',
    type: 'TEMPERATURE',
    id_warehouse: 1,
  };

  // Mocking deep relations required by sendAlertOnTemperatureOrHumidityOutOfRange
  const mockWarehousesService = {
    findOneById: jest.fn().mockResolvedValue({
      id: 1,
      name: 'Test Warehouse',
      farm: {
        country: {
          name: 'France',
          temperature_ideal: 20.0,
          temperature_tolerance_degrees: 5.0,
          humidity_ideal: 50.0,
          humidity_tolerance_percents: 10.0,
        },
      },
      batches: [],
    }),
  };

  const mockAlertsService = {
    create: jest.fn().mockResolvedValue({ id: 1 }),
  };

  const mockStatusesService = {
    create: jest.fn().mockResolvedValue({ id: 1, value: 'ALERT' }),
  };

  beforeAll(async () => {
    const allowGuard = {
      canActivate: jest.fn(() => true),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [IsolatedTestStatement],
          synchronize: true,
          logging: false,
        }),
        TypeOrmModule.forFeature([IsolatedTestStatement]),
      ],
      controllers: [StatementsController],
      providers: [
        StatementsService,
        { provide: WarehousesService, useValue: mockWarehousesService },
        { provide: AlertsService, useValue: mockAlertsService },
        { provide: StatusesService, useValue: mockStatusesService },
        // Bind the original Statement token to our isolated test entity
        {
          provide: getRepositoryToken(Statement),
          useExisting: getRepositoryToken(IsolatedTestStatement),
        },
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

  it('POST /statements should save a statement in database', async () => {
    const response = await request(app.getHttpServer())
      .post('/statements')
      .send(createStatementDto);

    if (response.status !== 201) {
      console.error('POST /statements failed payload check:', response.body);
    }

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('uuid');
    expect(Number(response.body.value)).toBe(22.50);

    createdStatementUuid = response.body.uuid;
    createdStatementId = response.body.id;
  });

  it('GET /statements should retrieve all statements', async () => {
    const response = await request(app.getHttpServer())
      .get('/statements');

    if (response.status !== 200) {
      console.error('GET /statements failed:', response.body);
    }

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0].uuid).toBe(createdStatementUuid);
  });

  it('GET /statements/type should retrieve all statements by specific type', async () => {
    const response = await request(app.getHttpServer())
      .get('/statements/type')
      .query({ type: 'TEMPERATURE' });

    if (response.status !== 200) {
      console.error('GET /statements/type failed:', response.body);
    }

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0].uuid).toBe(createdStatementUuid);
  });

  it('GET /statements/uuid should retrieve statement by UUID', async () => {
    const response = await request(app.getHttpServer())
      .get('/statements/uuid')
      .query({ uuid: createdStatementUuid });

    if (response.status !== 200) {
      console.error('GET /statements/uuid failed:', response.body);
    }

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(createdStatementId);
  });

  it('GET /statements/id should retrieve statement by ID', async () => {
    const response = await request(app.getHttpServer())
      .get('/statements/id')
      .query({ id: createdStatementId });

    if (response.status !== 200) {
      console.error('GET /statements/id failed:', response.body);
    }

    expect(response.status).toBe(200);
    expect(response.body.uuid).toBe(createdStatementUuid);
  });

  it('PATCH /statements should update database entry', async () => {
    const response = await request(app.getHttpServer())
      .patch('/statements')
      .query({ uuid: createdStatementUuid })
      .send({ value: '25.00' }); // String ici aussi pour le PATCH

    if (response.status !== 200) {
      console.error('PATCH /statements failed:', response.body);
    }

    expect(response.status).toBe(200);
    expect(Number(response.body.value)).toBe(25.00);
  });

  it('DELETE /statements should mark statement as deleted and return 204', async () => {
    const response = await request(app.getHttpServer())
      .delete('/statements')
      .query({ uuid: createdStatementUuid });

    if (response.status !== 204) {
      console.error('DELETE /statements failed:', response.body);
    }

    expect(response.status).toBe(204);
  });

  it('PATCH /statements/restore should reactivate the statement', async () => {
    const response = await request(app.getHttpServer())
      .patch('/statements/restore')
      .query({ uuid: createdStatementUuid });

    if (response.status !== 200) {
      console.error('PATCH /statements/restore failed:', response.body);
    }

    expect(response.status).toBe(200);
    expect(response.body.deleted_at).toBeNull();
  });
});