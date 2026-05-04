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
import { ArtistModule } from './artist/artist.module';
import { PostsController } from './community/controllers/posts.controller';
import { CommentsController } from './community/controllers/comments.controller';
import { PostsService } from './community/services/posts.service';
import { CommentsService } from './community/services/comments.service';
import { FandomController } from './fandom/fandom.controller';
import { FandomService } from './fandom/fandom.service';
import { ModuleService } from './module/module.service';
import { ArtistAccountController } from './artist-account/artist-account.controller';
import { ArtistAccountService } from './artist-account/artist-account.service';
import { ArtistAccountModule } from './artist-account/artist-account.module';
import { LiveStreamModule } from './live-stream/live-stream.module';
import { StorageModule } from './storage/storage.module';
import { FanProjectModule } from './fan-project/fan-project.module';

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
    ArtistModule,
    ArtistAccountModule,
    LiveStreamModule,
    StorageModule,
    FanProjectModule,
  ],
  controllers: [
    AppController,
    CoinController,
    PostsController,
    CommentsController,
    FandomController,
    ArtistAccountController,
  ],
  providers: [
    AppService,
    PrismaService,
    FirebaseModule,
    CoinService,
    OmiseService,
    PostsService,
    CommentsService,
    FandomService,
    ModuleService,
    ArtistAccountService,
  ],
})
export class AppModule {}
