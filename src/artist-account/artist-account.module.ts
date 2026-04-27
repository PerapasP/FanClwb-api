import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { ArtistAccountController } from './artist-account.controller';
import { ArtistAccountService } from './artist-account.service';

@Module({
  imports: [PrismaModule],
  controllers: [ArtistAccountController],
  providers: [ArtistAccountService],
  exports: [ArtistAccountService],
})
export class ArtistAccountModule {}
