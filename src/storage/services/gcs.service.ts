import { Injectable, Logger } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';

@Injectable()
export class GcsService {
  private storage: Storage;
  private bucketName: string;
  private readonly logger = new Logger(GcsService.name);

  constructor() {
    const projectId = process.env.GCP_PROJECT_ID!;
    const keyFilePath = process.env.GCP_KEY_FILE_PATH;
    this.bucketName = process.env.GCP_BUCKET_NAME!;

    // Local development: Use key file
    // Production (Cloud Run): Use Application Default Credentials
    if (keyFilePath && (process.env.ENV === 'development' || !process.env.ENV)) {
      this.storage = new Storage({
        projectId,
        keyFilename: keyFilePath,
      });
      this.logger.log('GCS initialized with key file');
    } else {
      this.storage = new Storage({
        projectId,
      });
      this.logger.log('GCS initialized with Application Default Credentials');
    }
  }

  /**
   * Uploads a file to GCS and returns the public URL
   * @param file The file buffer from Multer
   * @param destination The path in the bucket (e.g. 'profiles/user-1.jpg')
   */
  async uploadFile(file: Express.Multer.File, destination: string): Promise<string> {
    const bucket = this.storage.bucket(this.bucketName);
    const gcsFile = bucket.file(destination);

    await gcsFile.save(file.buffer, {
      contentType: file.mimetype,
      resumable: false,
    });

    return `https://storage.googleapis.com/${this.bucketName}/${destination}`;
  }

  async deleteFile(destination: string): Promise<void> {
    const bucket = this.storage.bucket(this.bucketName);
    try {
      await bucket.file(destination).delete();
    } catch (error) {
      this.logger.error(`Failed to delete file ${destination}: ${error.message}`);
    }
  }
}
