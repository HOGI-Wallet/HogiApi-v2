import { Test, TestingModule } from '@nestjs/testing';
import { CoinRatesService } from './coin-rates.service';

describe('CoinRatesService', () => {
  let service: CoinRatesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CoinRatesService],
    }).compile();

    service = module.get<CoinRatesService>(CoinRatesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
