import request from 'supertest';
import { describeCrudResourceE2e, getAuthHeaders } from './e2e-test-app';
import { AppRole } from './../src/utils/constants/roles.constant';

describeCrudResourceE2e('users', '/users', ({ getApp }) => {
    it('GET /users/email returns one user', async () => {
        const response = await request(getApp().getHttpServer())
            .get('/users/email')
            .set(getAuthHeaders(AppRole.ADMIN))
            .query({ email: 'john.doe@example.com' })
            .expect(200);

        expect(response.body).toEqual(
            expect.objectContaining({
                uuid: expect.any(String),
            }),
        );
    });
});