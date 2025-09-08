import { Test, TestingModule } from '@nestjs/testing';
import { FoundryController } from './foundry.controller';

describe('FoundryController', () => {
  let controller: FoundryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FoundryController],
    }).compile();

    controller = module.get<FoundryController>(FoundryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
