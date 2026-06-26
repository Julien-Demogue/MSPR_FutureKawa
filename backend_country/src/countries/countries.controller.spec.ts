import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { CountriesController } from './countries.controller';
import { CountriesService } from './countries.service';
import { Country } from './country.entity';
import { ServiceAuthGuard } from '../utils/guards/service-auth.guard';
import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';

// Isolated entity to bypass relation cascading and SQLite driver issues
@Entity('countries')
class IsolatedTestCountry {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 36, unique: true })
  uuid!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  temperature_ideal!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  temperature_tolerance_degrees!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  humidity_ideal!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  humidity_tolerance_percents!: number;

  @CreateDateColumn({ type: 'datetime' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at!: Date;

  @DeleteDateColumn({ type: 'datetime', nullable: true })
  deleted_at!: Date;
}

describe('Countries Integration Test', () => {
  let app: INestApplication;
  let createdCountryUuid: string;
  let createdCountryId: number;

  const testCountryName = 'Brazil';

  const createCountryDto = {
    name: testCountryName,
    temperature_ideal: 22.50,
    temperature_tolerance_degrees: 3.00,
    humidity_ideal: 65.00,
    humidity_tolerance_percents: 10.00,
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
          entities: [IsolatedTestCountry],
          synchronize: true,
          logging: false,
        }),
        TypeOrmModule.forFeature([IsolatedTestCountry]),
      ],
      controllers: [CountriesController],
      providers: [
        CountriesService,
        // Bind the original Country token to our isolated test entity
        {
          provide: getRepositoryToken(Country),
          useExisting: getRepositoryToken(IsolatedTestCountry),
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

  it('POST /countries should save a country in database', async () => {
    const response = await request(app.getHttpServer())
      .post('/countries')
      .send(createCountryDto);

    if (response.status !== 201) {
      console.error('POST /countries failed payload check:', response.body);
    }

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('uuid');
    expect(response.body.name).toBe(testCountryName);

    createdCountryUuid = response.body.uuid;
    createdCountryId = response.body.id;
  });

  it('GET /countries should retrieve all countries', async () => {
    const response = await request(app.getHttpServer())
      .get('/countries');

    if (response.status !== 200) {
      console.error('GET /countries failed:', response.body);
    }

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
    expect(response.body[0].uuid).toBe(createdCountryUuid);
  });

  it('GET /countries/uuid should retrieve country by UUID', async () => {
    const response = await request(app.getHttpServer())
      .get('/countries/uuid')
      .query({ uuid: createdCountryUuid });

    if (response.status !== 200) {
      console.error('GET /countries/uuid failed:', response.body);
    }

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(createdCountryId);
  });

  it('GET /countries/id should retrieve country by ID', async () => {
    const response = await request(app.getHttpServer())
      .get('/countries/id')
      .query({ id: createdCountryId });

    if (response.status !== 200) {
      console.error('GET /countries/id failed:', response.body);
    }

    expect(response.status).toBe(200);
    expect(response.body.uuid).toBe(createdCountryUuid);
  });

  it('GET /countries/name should retrieve country by name', async () => {
    const response = await request(app.getHttpServer())
      .get('/countries/name')
      .query({ name: testCountryName });

    if (response.status !== 200) {
      console.error('GET /countries/name failed:', response.body);
    }

    expect(response.status).toBe(200);
    expect(response.body.uuid).toBe(createdCountryUuid);
  });

  it('PATCH /countries should update database entry', async () => {
    const response = await request(app.getHttpServer())
      .patch('/countries')
      .query({ uuid: createdCountryUuid })
      .send({ temperature_ideal: 23.00 });

    if (response.status !== 200) {
      console.error('PATCH /countries failed:', response.body);
    }

    expect(response.status).toBe(200);
    expect(Number(response.body.temperature_ideal)).toBe(23.00);
  });

  it('DELETE /countries should mark country as deleted and return 204', async () => {
    const response = await request(app.getHttpServer())
      .delete('/countries')
      .query({ uuid: createdCountryUuid });

    if (response.status !== 204) {
      console.error('DELETE /countries failed:', response.body);
    }

    expect(response.status).toBe(204);
  });

  it('PATCH /countries/restore should reactivate the country', async () => {
    const response = await request(app.getHttpServer())
      .patch('/countries/restore')
      .query({ uuid: createdCountryUuid });

    if (response.status !== 200) {
      console.error('PATCH /countries/restore failed:', response.body);
    }

    expect(response.status).toBe(200);
    expect(response.body.deleted_at).toBeNull();
  });
});