import request from 'supertest';
import { describeCrudResourceE2e } from './e2e-test-app';

describeCrudResourceE2e('users', '/users', ({ getApp }) => {
    it('GET /users/email returns one user', async () => {
        const response = await request(getApp().getHttpServer())
            .get('/users/email')
            .query({ email: 'john.doe@example.com' })
            .expect(200);

        expect(response.body).toEqual(
            expect.objectContaining({
                uuid: expect.any(String),
            }),
        );
    });
});