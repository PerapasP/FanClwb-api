import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LiveStreamController } from './live-stream.controller';
import { LiveStreamService } from './live-stream.service';
import { LiveStreamGateway } from './live-stream.gateway';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    // Re-use the same JWT config as the auth module
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRES_IN', '15m') as never,
        },
      }),
    }),
  ],
  controllers: [LiveStreamController],
  providers: [LiveStreamService, LiveStreamGateway],
  exports: [LiveStreamService],
})
export class LiveStreamModule {}
