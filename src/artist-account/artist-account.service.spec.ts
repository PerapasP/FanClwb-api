import { Test, TestingModule } from '@nestjs/testing';
import { ArtistAccountService } from './artist-account.service';

describe('ArtistAccountService', () => {
  let service: ArtistAccountService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ArtistAccountService],
    }).compile();

    service = module.get<ArtistAccountService>(ArtistAccountService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
