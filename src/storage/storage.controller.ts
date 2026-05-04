import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StorageService } from './storage.service';
import type { AuthenticatedRequest } from '../auth/interfaces/auth.interface';
import { Logger } from '@nestjs/common';

@Controller('storage')
export class StorageController {
  private readonly logger = new Logger(StorageController.name);
  constructor(private readonly storageService: StorageService) {}

  @Post('upload/profile')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfile(
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    this.logger.log(`Upload profile request for user: ${req.user?.user_id}`);
    if (!file) {
      this.logger.error('Upload failed: No file received in the request');
    }
    return this.storageService.uploadProfileImage(req.user.user_id, file);
  }

  @Post('upload/project')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadProject(
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.storageService.uploadProjectImage(file);
  }
  
  @Post('upload/artist')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadArtist(
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.storageService.uploadArtistImage(file);
  }

  @Post('upload/post')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadPost(
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.storageService.uploadPostImage(file);
  }

  @Post('upload/fandom')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFandom(
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.storageService.uploadFandomImage(file);
  }

  @Post('upload/live')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadLive(
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.storageService.uploadLiveThumbnail(file);
  }
}
