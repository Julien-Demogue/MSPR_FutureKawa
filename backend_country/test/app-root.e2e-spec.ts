import request from 'supertest';
import { createE2eTestingApp } from './e2e-test-app';

describe('App root route (e2e)', () => {
    it('/ (GET)', async () => {
        const { app } = await createE2eTestingApp();

        await request(app.getHttpServer())
            .get('/')
            .expect(200)
            .expect('The API is working');

        await app.close();
    });
});
