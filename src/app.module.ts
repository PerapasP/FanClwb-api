import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProfileModule } from './profile/profile.module';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { FirebaseModule } from './firebase/firebase.module';
import { CoinService } from './coin/coin.service';
import { CoinController } from './coin/coin.controller';
import { CoinModule } from './coin/coin.module';
import { OmiseService } from './omise/omise.service';
import { OmiseModule } from './omise/omise.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UsersModule,
    ProfileModule,
    PrismaModule,
    FirebaseModule,
    CoinModule,
    OmiseModule,
  ],
  controllers: [AppController, CoinController],
  providers: [
    AppService,
    PrismaService,
    FirebaseModule,
    CoinService,
    OmiseService,
  ],
})
export class AppModule {}
