import request from 'supertest';
import { describeCrudResourceE2e, getServiceAuthHeaders } from './e2e-test-app';

describeCrudResourceE2e('countries', '/countries', ({ getApp }) => {
    it('GET /countries/name returns one country', async () => {
        const response = await request(getApp().getHttpServer())
            .get('/countries/name')
            .set(getServiceAuthHeaders())
            .query({ name: 'Brazil' })
            .expect(200);

        expect(response.body).toEqual(
            expect.objectContaining({
                uuid: expect.any(String),
            }),
        );
    });
});
