import { Test, TestingModule } from '@nestjs/testing';
import { FandomController } from './fandom.controller';

describe('FandomController', () => {
  let controller: FandomController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FandomController],
    }).compile();

    controller = module.get<FandomController>(FandomController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
