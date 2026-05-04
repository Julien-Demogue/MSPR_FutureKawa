import request from 'supertest';
import { describeCrudResourceE2e } from './e2e-test-app';

describeCrudResourceE2e('roles', '/roles', ({ getApp }) => {
    it('GET /roles/label returns one role', async () => {
        const response = await request(getApp().getHttpServer())
            .get('/roles/label')
            .query({ label: 'Admin' })
            .expect(200);

        expect(response.body).toEqual(
            expect.objectContaining({
                uuid: expect.any(String),
            }),
        );
    });
});