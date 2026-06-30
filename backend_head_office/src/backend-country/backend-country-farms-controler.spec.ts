import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import axios from 'axios';
import { BackendCountryFarmsController } from './backend-country-farms.controller';
import { farm_url } from '../utils/constants/backend-country.constants';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock('../utils/decorators/guard.decorator', () => ({
    Guard: jest.fn(() => () => {
    }),
}));

describe('BackendCountryFarmsController', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [BackendCountryFarmsController],
        }).compile();

        app = module.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('GET /backend_country/farms should proxy the request and return farm data', async () => {
        const mockResponseData = [{ id: 1, message: 'High humidity detected' }];

        mockedAxios.get.mockResolvedValueOnce({
            status: 200,
            data: mockResponseData,
        });

        await request(app.getHttpServer())
            .get('/backend_country/farms')
            .expect(200)
            .expect((res) => {
                expect(res.body).toEqual(mockResponseData);
            });

        expect(mockedAxios.get).toHaveBeenCalledWith(
            `${farm_url}`,
            expect.any(Object)
        );
    });

    it('POST /backend_country/farms should forward the payload and return 201', async () => {
        const payload = { message: 'Manual farm trigger', level: 'warning' };
        const mockResponseData = { uuid: '1234-abcd', ...payload };

        mockedAxios.post.mockResolvedValueOnce({
            status: 201,
            data: mockResponseData,
        });

        await request(app.getHttpServer())
            .post('/backend_country/farms')
            .send(payload)
            .expect(201)
            .expect((res) => {
                expect(res.body.uuid).toBe('1234-abcd');
            });

        expect(mockedAxios.post).toHaveBeenCalledWith(
            `${farm_url}`,
            payload,
            expect.any(Object)
        );
    });

    it('GET /backend_country/farms/uuid should pass the uuid query parameter', async () => {
        const targetUuid = '550e8400-e29b-41d4-a716-446655440000';
        const mockResponseData = { uuid: targetUuid, message: 'Specific farm' };

        mockedAxios.get.mockResolvedValueOnce({
            status: 200,
            data: mockResponseData,
        });

        await request(app.getHttpServer())
            .get('/backend_country/farms/uuid')
            .query({ uuid: targetUuid })
            .expect(200);

        expect(mockedAxios.get).toHaveBeenCalledWith(
            `${farm_url}uuid?uuid=${targetUuid}`,
            expect.any(Object)
        );
    });

    it('DELETE /backend_country/farms should forward delete request', async () => {
        const targetUuid = '550e8400-e29b-41d4-a716-446655440000';

        mockedAxios.delete.mockResolvedValueOnce({
            status: 204,
            data: {},
        });

        await request(app.getHttpServer())
            .delete('/backend_country/farms')
            .query({ uuid: targetUuid })
            .expect(204);

        expect(mockedAxios.delete).toHaveBeenCalledWith(
            `${farm_url}?uuid=${targetUuid}`,
            expect.any(Object)
        );
    });
});