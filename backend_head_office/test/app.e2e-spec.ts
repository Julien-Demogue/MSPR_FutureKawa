import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createE2eTestingApp } from './e2e-test-app';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const context = await createE2eTestingApp();
    app = context.app as INestApplication<App>;
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('The API is working');
  });

  afterEach(async () => {
    await app.close();
  });
});
