import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SettingsService } from './settings.service';

describe('SettingsService', () => {
  let service: SettingsService;

  beforeEach(async () => {
    const configServiceMock = {
      get: jest.fn((key: string) => {
        if (key === 'TESTING') return 'true';
        if (key === 'COOKIE_SECURE') return 'false';
        return undefined;
      }),
      getOrThrow: jest.fn((key: string) => {
        const values: Record<string, string> = {
          BASE_URL: 'http://localhost:3000',
          FRONT_URL: 'http://localhost:5173',
          JWT_SECRET: 'test-secret',
        };
        return values[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
