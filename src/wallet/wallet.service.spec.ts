import { Test, TestingModule } from '@nestjs/testing';
import { WalletCore } from './wallet-core.service';

describe('WalletService', () => {
  let service: WalletCore;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WalletCore],
    }).compile();

    service = module.get<WalletCore>(WalletCore);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
