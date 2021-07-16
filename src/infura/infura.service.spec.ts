import { Test, TestingModule } from '@nestjs/testing';
import { InfuraService } from './infura.service';

describe('InfuraService', () => {
  let service: InfuraService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InfuraService],
    }).compile();

    service = module.get<InfuraService>(InfuraService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
