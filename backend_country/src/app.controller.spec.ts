import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { StatementsService } from './statements/statements.service';

describe('AppController', () => {
  let appController: AppController;

  const appServiceMock = {
    getHello: jest.fn(),
  };

  const statementsServiceMock = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: appServiceMock,
        },
        {
          provide: StatementsService,
          useValue: statementsServiceMock,
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

  describe('MQTT event handlers', () => {
    it('should process temperature updates and save them as numbers', () => {
      const mockPayload = '24.5';

      appController.handleTemperatureUpdate(mockPayload);

      expect(statementsServiceMock.create).toHaveBeenCalledTimes(1);
      expect(statementsServiceMock.create).toHaveBeenCalledWith({
        value: 24.5,
        type: 'TEMPERATURE',
        id_warehouse: 1,
      });
    });

    it('should process humidity updates and save them as numbers', () => {
      const mockPayload = '55';

      appController.handleHumidityUpdate(mockPayload);

      expect(statementsServiceMock.create).toHaveBeenCalledTimes(1);
      expect(statementsServiceMock.create).toHaveBeenCalledWith({
        value: 55,
        type: 'HUMIDITY',
        id_warehouse: 1,
      });
    });
  });
});