import { Test, TestingModule } from '@nestjs/testing';
import { ArtistAccountController } from './artist-account.controller';

describe('ArtistAccountController', () => {
  let controller: ArtistAccountController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ArtistAccountController],
    }).compile();

    controller = module.get<ArtistAccountController>(ArtistAccountController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
