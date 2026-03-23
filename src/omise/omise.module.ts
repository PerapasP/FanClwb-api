import { Module, Global } from '@nestjs/common';
import { OmiseService } from './omise.service';

@Global()
@Module({
  providers: [OmiseService],
  exports: [OmiseService],
})
export class OmiseModule {}
