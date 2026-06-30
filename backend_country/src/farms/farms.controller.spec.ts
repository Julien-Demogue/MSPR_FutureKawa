import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { FarmsController } from './farms.controller';
import { FarmsService } from './farms.service';
import { Farm } from './farm.entity';
import { ServiceAuthGuard } from '../utils/guards/service-auth.guard';
import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';
import { CountriesService } from '../countries/countries.service';

// Isolated entity to bypass relation cascading and SQLite driver issues
@Entity('farms')
class IsolatedTestFarm {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 36, unique: true })
  uuid!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ name: 'id_country' })
  id_country!: number;

  @CreateDateColumn({ type: 'datetime' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at!: Date;

  @DeleteDateColumn({ type: 'datetime', nullable: true })
  deleted_at!: Date;
}

describe('Farms Integration Test', () => {
  let app: INestApplication;
  let createdFarmUuid: string;
  let createdFarmId: number;

  const testFarmName = 'Farm Test Integrations';

  const createFarmDto = {
    name: testFarmName,
    id_country: 1,
  };

  const mockCountriesService = {
    // Bypass foreign key checks in service validation
    findOneById: jest.fn().mockResolvedValue({ id: 1, name: 'France' }),
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
          entities: [IsolatedTestFarm],
          synchronize: true,
          logging: false,
        }),
        TypeOrmModule.forFeature([IsolatedTestFarm]),
      ],
      controllers: [FarmsController],
      providers: [
        FarmsService,
        {
          provide: CountriesService,
          useValue: mockCountriesService,
        },
        // Bind the original Farm token to our isolated test entity
        {
          provide: getRepositoryToken(Farm),
          useExisting: getRepositoryToken(IsolatedTestFarm),
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

  it('POST /farms should save a farm in database', async () => {
    const response = await request(app.getHttpServer())
      .post('/farms')
      .send(createFarmDto);

    if (response.status !== 201) {
      console.error('POST /farms failed payload check:', response.body);
    }

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('uuid');
    expect(response.body.name).toBe(testFarmName);

    createdFarmUuid = response.body.uuid;
    createdFarmId = response.body.id;
  });

  it('GET /farms should retrieve all farms', async () => {
    const response = await request(app.getHttpServer())
      .get('/farms');

    if (response.status !== 200) {
      console.error('GET /farms failed:', response.body);
    }

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0].uuid).toBe(createdFarmUuid);
  });

  it('GET /farms/uuid should retrieve farm by UUID', async () => {
    const response = await request(app.getHttpServer())
      .get('/farms/uuid')
      .query({ uuid: createdFarmUuid });

    if (response.status !== 200) {
      console.error('GET /farms/uuid failed:', response.body);
    }

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(createdFarmId);
  });

  it('GET /farms/id should retrieve farm by ID', async () => {
    const response = await request(app.getHttpServer())
      .get('/farms/id')
      .query({ id: createdFarmId });

    if (response.status !== 200) {
      console.error('GET /farms/id failed:', response.body);
    }

    expect(response.status).toBe(200);
    expect(response.body.uuid).toBe(createdFarmUuid);
  });

  it('PATCH /farms should update database entry', async () => {
    const response = await request(app.getHttpServer())
      .patch('/farms')
      .query({ uuid: createdFarmUuid })
      .send({ name: 'Farm Updated' });

    if (response.status !== 200) {
      console.error('PATCH /farms failed:', response.body);
    }

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Farm Updated');
  });

  it('DELETE /farms should mark farm as deleted and return 204', async () => {
    const response = await request(app.getHttpServer())
      .delete('/farms')
      .query({ uuid: createdFarmUuid });

    if (response.status !== 204) {
      console.error('DELETE /farms failed:', response.body);
    }

    expect(response.status).toBe(204);
  });

  it('PATCH /farms/restore should reactivate the farm', async () => {
    const response = await request(app.getHttpServer())
      .patch('/farms/restore')
      .query({ uuid: createdFarmUuid });

    if (response.status !== 200) {
      console.error('PATCH /farms/restore failed:', response.body);
    }

    expect(response.status).toBe(200);
    expect(response.body.deleted_at).toBeNull();
  });
});