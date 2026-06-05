import request from 'supertest';
import { describeCrudResourceE2e, getServiceAuthHeaders } from './e2e-test-app';

describeCrudResourceE2e('statuses', '/statuses', ({ getApp }) => {
    it('GET /statuses/value returns statuses list', async () => {
        const response = await request(getApp().getHttpServer())
            .get('/statuses/value')
            .set(getServiceAuthHeaders())
            .query({ value: 'validated' })
            .expect(200);

        expect(response.body).toHaveLength(1);
    });
});
