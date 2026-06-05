import request from 'supertest';
import { describeCrudResourceE2e, getAuthHeaders } from './e2e-test-app';
import { AppRole } from './../src/utils/constants/roles.constant';

describeCrudResourceE2e('roles', '/roles', ({ getApp }) => {
    it('GET /roles/label returns one role', async () => {
        const response = await request(getApp().getHttpServer())
            .get('/roles/label')
            .set(getAuthHeaders(AppRole.ADMIN))
            .query({ label: 'Admin' })
            .expect(200);

        expect(response.body).toEqual(
            expect.objectContaining({
                uuid: expect.any(String),
            }),
        );
    });
});