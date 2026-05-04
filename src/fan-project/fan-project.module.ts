import { Module } from '@nestjs/common';
import { FanProjectService } from './fan-project.service';
import { FanProjectController } from './fan-project.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FanProjectController],
  providers: [FanProjectService],
  exports: [FanProjectService],
})
export class FanProjectModule {}
