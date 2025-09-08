import { Test, TestingModule } from '@nestjs/testing';
import { FoundryService } from './foundry.service';

describe('FoundryService', () => {
  let service: FoundryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FoundryService],
    }).compile();

    service = module.get<FoundryService>(FoundryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
