import request from 'supertest';
import { describeCrudResourceE2e } from './e2e-test-app';

describeCrudResourceE2e('countries', '/countries', ({ getApp }) => {
    it('GET /countries/name returns one country', async () => {
        const response = await request(getApp().getHttpServer())
            .get('/countries/name')
            .query({ name: 'Brazil' })
            .expect(200);

        expect(response.body).toEqual(
            expect.objectContaining({
                uuid: expect.any(String),
            }),
        );
    });
});
