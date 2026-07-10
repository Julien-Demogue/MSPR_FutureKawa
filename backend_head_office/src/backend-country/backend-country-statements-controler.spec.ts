import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import axios from 'axios';
import { BackendCountryStatementsController } from './backend-country-statements.controller';
import { statement_url } from '../utils/constants/backend-country.constants';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock('../utils/decorators/guard.decorator', () => ({
    Guard: jest.fn(() => () => {
    }),
}));

describe('BackendCountryStatementsController', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [BackendCountryStatementsController],
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

    it('GET /backend_country/statements should proxy the request and return statement data', async () => {
        const mockResponseData = [{ id: 1, message: 'High humidity detected' }];

        mockedAxios.get.mockResolvedValueOnce({
            status: 200,
            data: mockResponseData,
        });

        await request(app.getHttpServer())
            .get('/backend_country/statements')
            .expect(200)
            .expect((res) => {
                expect(res.body).toEqual(mockResponseData);
            });

        expect(mockedAxios.get).toHaveBeenCalledWith(
            `${statement_url}`,
            expect.any(Object)
        );
    });

    it('POST /backend_country/statements should forward the payload and return 201', async () => {
        const payload = { message: 'Manual statement trigger', level: 'warning' };
        const mockResponseData = { uuid: '1234-abcd', ...payload };

        mockedAxios.post.mockResolvedValueOnce({
            status: 201,
            data: mockResponseData,
        });

        await request(app.getHttpServer())
            .post('/backend_country/statements')
            .send(payload)
            .expect(201)
            .expect((res) => {
                expect(res.body.uuid).toBe('1234-abcd');
            });

        expect(mockedAxios.post).toHaveBeenCalledWith(
            `${statement_url}`,
            payload,
            expect.any(Object)
        );
    });

    it('GET /backend_country/statements should forward offset and count query params', async () => {
        const mockResponseData = [{ id: 1, message: 'High humidity detected' }];

        mockedAxios.get.mockResolvedValueOnce({
            status: 200,
            data: mockResponseData,
        });

        await request(app.getHttpServer())
            .get('/backend_country/statements')
            .query({ offset: 10, count: 50 })
            .expect(200);

        expect(mockedAxios.get).toHaveBeenCalledWith(
            `${statement_url}?offset=10&count=50`,
            expect.any(Object)
        );
    });

    it('GET /backend_country/statements/type should proxy the type filter and pagination', async () => {
        const mockResponseData = [{ id: 1, type: 'TEMPERATURE', value: 28.5 }];

        mockedAxios.get.mockResolvedValueOnce({
            status: 200,
            data: mockResponseData,
        });

        await request(app.getHttpServer())
            .get('/backend_country/statements/type')
            .query({ type: 'TEMPERATURE', offset: 0, count: 200 })
            .expect(200)
            .expect((res) => {
                expect(res.body).toEqual(mockResponseData);
            });

        expect(mockedAxios.get).toHaveBeenCalledWith(
            `${statement_url}type?type=TEMPERATURE&offset=0&count=200`,
            expect.any(Object)
        );
    });

    it('GET /backend_country/statements/uuid should pass the uuid query parameter', async () => {
        const targetUuid = '550e8400-e29b-41d4-a716-446655440000';
        const mockResponseData = { uuid: targetUuid, message: 'Specific statement' };

        mockedAxios.get.mockResolvedValueOnce({
            status: 200,
            data: mockResponseData,
        });

        await request(app.getHttpServer())
            .get('/backend_country/statements/uuid')
            .query({ uuid: targetUuid })
            .expect(200);

        expect(mockedAxios.get).toHaveBeenCalledWith(
            `${statement_url}uuid?uuid=${targetUuid}`,
            expect.any(Object)
        );
    });

    it('DELETE /backend_country/statements should forward delete request', async () => {
        const targetUuid = '550e8400-e29b-41d4-a716-446655440000';

        mockedAxios.delete.mockResolvedValueOnce({
            status: 204,
            data: {},
        });

        await request(app.getHttpServer())
            .delete('/backend_country/statements')
            .query({ uuid: targetUuid })
            .expect(204);

        expect(mockedAxios.delete).toHaveBeenCalledWith(
            `${statement_url}?uuid=${targetUuid}`,
            expect.any(Object)
        );
    });
});