import { Test, TestingModule } from '@nestjs/testing';
import { CoinRatesController } from './coin-rates.controller';

describe('CoinRatesController', () => {
  let controller: CoinRatesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoinRatesController],
    }).compile();

    controller = module.get<CoinRatesController>(CoinRatesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
