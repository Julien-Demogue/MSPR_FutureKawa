import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';
import { AppController } from './app.controller';

describe('AppController', () => {
  let appController: AppController;
  const appServiceMock = {
    getHello: jest.fn(),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: appServiceMock,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    jest.clearAllMocks();
  });

  describe('root', () => {
    it('should return the application health message', () => {
      appServiceMock.getHello.mockReturnValue('The API is working');

      expect(appController.getHello()).toBe('The API is working');
      expect(appServiceMock.getHello).toHaveBeenCalledTimes(1);
    });
  });
});
