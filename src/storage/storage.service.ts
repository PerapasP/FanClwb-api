import { Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class StorageService {
  private storage: Storage;
  private bucketName: string;
  private readonly logger = new Logger(StorageService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const keyPath = this.configService.get<string>('GCP_KEY_FILE_PATH')!;
    const projectId = this.configService.get<string>('GCP_PROJECT_ID')!;
    this.bucketName = this.configService.get<string>('GCP_BUCKET_NAME')!;

    if (!keyPath || !projectId || !this.bucketName) {
      this.logger.error('GCP Configuration is missing in .env');
    }

    // ตรวจสอบว่าไฟล์ Key มีอยู่จริง
    const absoluteKeyPath = path.isAbsolute(keyPath)
      ? keyPath
      : path.join(process.cwd(), keyPath);

    if (!fs.existsSync(absoluteKeyPath)) {
      this.logger.error(`GCP Key file not found at: ${absoluteKeyPath}`);
    }

    this.storage = new Storage({
      keyFilename: absoluteKeyPath,
      projectId: projectId,
    });
  }

  async uploadProfileImage(userId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      const bucket = this.storage.bucket(this.bucketName);
      const fileName = `profiles/${userId}-${Date.now()}${path.extname(file.originalname)}`;
      const blob = bucket.file(fileName);

      const blobStream = blob.createWriteStream({
        resumable: false,
        contentType: file.mimetype,
      });

      return new Promise((resolve, reject) => {
        blobStream.on('error', (err) => {
          this.logger.error('Blob Stream Error:', err);
          reject(new InternalServerErrorException('GCP Upload stream error'));
        });

        blobStream.on('finish', async () => {
          try {
            const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${fileName}`;

            await this.prisma.users.update({
              where: { user_id: userId },
              data: { image_url: publicUrl },
            });

            resolve({ url: publicUrl });
          } catch (error) {
            this.logger.error('Finish Process Error:', error);
            reject(new InternalServerErrorException('Error updating user profile after upload'));
          }
        });

        blobStream.end(file.buffer);
      });
    } catch (error) {
      this.logger.error('Upload Process Error:', error);
      throw new InternalServerErrorException('Failed to process upload');
    }
  }

  async uploadProjectImage(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      const bucket = this.storage.bucket(this.bucketName);
      const fileName = `projects/${Date.now()}${path.extname(file.originalname)}`;
      const blob = bucket.file(fileName);

      const blobStream = blob.createWriteStream({
        resumable: false,
        contentType: file.mimetype,
      });

      return new Promise((resolve, reject) => {
        blobStream.on('error', (err) => {
          this.logger.error('Blob Stream Error:', err);
          reject(new InternalServerErrorException('GCP Upload stream error'));
        });

        blobStream.on('finish', () => {
          const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${fileName}`;
          resolve({ url: publicUrl });
        });

        blobStream.end(file.buffer);
      });
    } catch (error) {
      this.logger.error('Upload Process Error:', error);
      throw new InternalServerErrorException('Failed to process upload');
    }
  }

  async uploadArtistImage(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      const bucket = this.storage.bucket(this.bucketName);
      const fileName = `artists/${Date.now()}${path.extname(file.originalname)}`;
      const blob = bucket.file(fileName);

      const blobStream = blob.createWriteStream({
        resumable: false,
        contentType: file.mimetype,
      });

      return new Promise((resolve, reject) => {
        blobStream.on('error', (err) => {
          this.logger.error('Blob Stream Error:', err);
          reject(new InternalServerErrorException('GCP Upload stream error'));
        });

        blobStream.on('finish', () => {
          const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${fileName}`;
          resolve({ url: publicUrl });
        });

        blobStream.end(file.buffer);
      });
    } catch (error) {
      this.logger.error('Upload Process Error:', error);
      throw new InternalServerErrorException('Failed to process upload');
    }
  }

  async uploadPostImage(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      const bucket = this.storage.bucket(this.bucketName);
      const fileName = `posts/${Date.now()}${path.extname(file.originalname)}`;
      const blob = bucket.file(fileName);

      const blobStream = blob.createWriteStream({
        resumable: false,
        contentType: file.mimetype,
      });

      return new Promise((resolve, reject) => {
        blobStream.on('error', (err) => {
          this.logger.error('Blob Stream Error:', err);
          reject(new InternalServerErrorException('GCP Upload stream error'));
        });

        blobStream.on('finish', () => {
          const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${fileName}`;
          resolve({ url: publicUrl });
        });

        blobStream.end(file.buffer);
      });
    } catch (error) {
      this.logger.error('Upload Process Error:', error);
      throw new InternalServerErrorException('Failed to process upload');
    }
  }

  async uploadFandomImage(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      const bucket = this.storage.bucket(this.bucketName);
      const fileName = `fandoms/${Date.now()}${path.extname(file.originalname)}`;
      const blob = bucket.file(fileName);

      const blobStream = blob.createWriteStream({
        resumable: false,
        contentType: file.mimetype,
      });

      return new Promise((resolve, reject) => {
        blobStream.on('error', (err) => {
          this.logger.error('Blob Stream Error:', err);
          reject(new InternalServerErrorException('GCP Upload stream error'));
        });

        blobStream.on('finish', () => {
          const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${fileName}`;
          resolve({ url: publicUrl });
        });

        blobStream.end(file.buffer);
      });
    } catch (error) {
      this.logger.error('Upload Process Error:', error);
      throw new InternalServerErrorException('Failed to process upload');
    }
  }

  async uploadLiveThumbnail(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      const bucket = this.storage.bucket(this.bucketName);
      const fileName = `live-thumbnails/${Date.now()}${path.extname(file.originalname || '.jpg')}`;
      const blob = bucket.file(fileName);

      const blobStream = blob.createWriteStream({
        resumable: false,
        contentType: file.mimetype || 'image/jpeg',
      });

      return new Promise((resolve, reject) => {
        blobStream.on('error', (err) => {
          this.logger.error('Blob Stream Error:', err);
          reject(new InternalServerErrorException('GCP Upload stream error'));
        });

        blobStream.on('finish', () => {
          const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${fileName}`;
          resolve({ url: publicUrl });
        });

        blobStream.end(file.buffer);
      });
    } catch (error) {
      this.logger.error('Upload Process Error:', error);
      throw new InternalServerErrorException('Failed to process upload');
    }
  }
}
