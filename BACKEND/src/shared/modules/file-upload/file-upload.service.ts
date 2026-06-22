import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';
import { SupabaseService } from '../supabase/supabase.service';

export type UploadSubfolder =
  | 'images'
  | 'profile'
  | 'forms'
  | 'venues'
  | 'vendors'
  | 'quotation'
  | 'booking';

type UploadStorageProvider = 'local' | 'supabase';

@Injectable()
export class FileUploadService {
  private readonly uploadRoot: string;
  private readonly apiBaseUrl: string;
  private readonly storageProvider: UploadStorageProvider;

  constructor(
    private readonly configService: ConfigService,
    private readonly supabaseService: SupabaseService,
  ) {
    const configuredFolder =
      this.configService.get<string>('upload.folder') || 'uploads';
    this.uploadRoot = path.join(process.cwd(), configuredFolder);
    this.apiBaseUrl = this.resolveApiBaseUrl();
    this.storageProvider = this.resolveStorageProvider();

    if (this.storageProvider === 'local') {
      this.ensureDirectory(this.uploadRoot);
    }
  }

  getApiBaseUrl(): string {
    return this.apiBaseUrl;
  }

  getStorageProvider(): UploadStorageProvider {
    return this.storageProvider;
  }

  async saveUploadedFile(
    file: Express.Multer.File,
    subfolder: UploadSubfolder = 'images',
  ): Promise<string> {
    this.validateFile(file);

    if (file.buffer?.length) {
      return this.saveBuffer(
        file.buffer,
        file.originalname || 'file',
        file.mimetype,
        subfolder,
      );
    }

    const diskPath = (file as Express.Multer.File & { path?: string }).path;
    if (diskPath && fs.existsSync(diskPath)) {
      const buffer = fs.readFileSync(diskPath);
      const url = await this.saveBuffer(
        buffer,
        file.originalname || 'file',
        file.mimetype,
        subfolder,
      );
      fs.unlinkSync(diskPath);
      return url;
    }

    throw new BadRequestException('File buffer is missing');
  }

  async saveBuffer(
    buffer: Buffer,
    originalName: string,
    mimetype: string,
    subfolder: UploadSubfolder = 'images',
  ): Promise<string> {
    if (!buffer?.length) {
      throw new BadRequestException('File buffer is empty');
    }

    if (this.storageProvider === 'supabase') {
      return this.uploadToSupabase(buffer, originalName, mimetype, subfolder);
    }

    return this.saveToLocalDisk(buffer, originalName, subfolder);
  }

  async saveBase64Image(
    dataUri: string,
    subfolder: UploadSubfolder = 'images',
  ): Promise<string> {
    const { buffer, mimetype, extension } = this.parseBase64Image(dataUri);
    return this.saveBuffer(buffer, `image.${extension}`, mimetype, subfolder);
  }

  /**
   * Upload base64 images to storage and return public URLs.
   * Existing http(s) URLs are returned unchanged.
   */
  async saveBase64Images(
    images: string[],
    subfolder: UploadSubfolder = 'images',
  ): Promise<string[]> {
    const urls: string[] = [];

    for (const image of images) {
      const value = String(image || '').trim();
      if (!value) {
        continue;
      }

      if (this.isExistingImageUrl(value)) {
        urls.push(value);
        continue;
      }

      if (value.startsWith('data:image')) {
        urls.push(await this.saveBase64Image(value, subfolder));
      }
    }

    return urls;
  }

  buildPublicUrl(relativePath: string): string {
    const normalizedPath = relativePath.startsWith('/')
      ? relativePath
      : `/${relativePath}`;

    return `${this.apiBaseUrl.replace(/\/+$/, '')}${normalizedPath}`;
  }

  private resolveStorageProvider(): UploadStorageProvider {
    const explicit = (
      process.env.UPLOAD_STORAGE ||
      this.configService.get<string>('upload.storage') ||
      ''
    ).toLowerCase();

    if (explicit === 'local' || explicit === 'supabase') {
      return explicit;
    }

    const nodeEnv = (process.env.NODE_ENV || 'local').toLowerCase();
    return nodeEnv === 'local' ? 'local' : 'supabase';
  }

  private resolveApiBaseUrl(): string {
    const fromEnv =
      process.env.API_BASE_URL ||
      process.env.BACKEND_URL ||
      process.env.APP_URL;

    if (fromEnv) {
      return fromEnv.replace(/\/+$/, '');
    }

    const fromConfig = this.configService.get<string>('upload.apiBaseUrl');
    if (fromConfig) {
      return fromConfig.replace(/\/+$/, '');
    }

    const port = this.configService.get<number>('server.port') || 3000;
    return `http://localhost:${port}`;
  }

  private saveToLocalDisk(
    buffer: Buffer,
    originalName: string,
    subfolder: UploadSubfolder,
  ): string {
    const directory = this.ensureDirectory(path.join(this.uploadRoot, subfolder));
    const fileName = this.buildUniqueFileName(originalName, subfolder);
    const absolutePath = path.join(directory, fileName);

    fs.writeFileSync(absolutePath, buffer);

    return this.buildPublicUrl(`/uploads/${subfolder}/${fileName}`);
  }

  private async uploadToSupabase(
    buffer: Buffer,
    originalName: string,
    mimetype: string,
    subfolder: UploadSubfolder,
  ): Promise<string> {
    const fileName = this.buildUniqueFileName(originalName, subfolder);
    const filePath = `${subfolder}/${fileName}`;
    const bucket = this.getSupabaseBucket();

    const s3Uploaded = await this.trySupabaseS3Upload(
      buffer,
      filePath,
      mimetype,
      bucket,
    );
    if (s3Uploaded) {
      return s3Uploaded;
    }

    if (this.supabaseService.isAvailable()) {
      const { publicUrl } = await this.supabaseService.upload({
        filePath,
        file: buffer,
        contentType: mimetype,
        bucket,
        upsert: true,
      });

      if (publicUrl) {
        return publicUrl;
      }
    }

    throw new BadRequestException(
      'Supabase storage is not configured. Set SUPABASE_S3_* or SUPABASE_URL + SUPABASE_SERVICE_KEY environment variables.',
    );
  }

  private async trySupabaseS3Upload(
    buffer: Buffer,
    filePath: string,
    mimetype: string,
    bucket: string,
  ): Promise<string | null> {
    const s3Config = this.configService.get<Record<string, string>>('supabase.s3') || {};
    const endpoint =
      process.env.SUPABASE_S3_ENDPOINT || s3Config.endpoint || '';
    const region =
      process.env.SUPABASE_S3_REGION || s3Config.region || 'ap-northeast-1';
    const accessKeyId =
      process.env.SUPABASE_S3_ACCESS_KEY_ID || s3Config.accessKeyId || '';
    const secretAccessKey =
      process.env.SUPABASE_S3_SECRET_ACCESS_KEY || s3Config.secretAccessKey || '';

    if (!endpoint || !accessKeyId || !secretAccessKey) {
      return null;
    }

    const client = new S3Client({
      region,
      endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: filePath,
        Body: buffer,
        ContentType: mimetype,
      }),
    );

    return this.buildSupabasePublicUrl(bucket, filePath);
  }

  private buildSupabasePublicUrl(bucket: string, filePath: string): string {
    const configuredPublicUrl = (
      process.env.SUPABASE_PUBLIC_STORAGE_URL ||
      this.configService.get<string>('supabase.publicStorageUrl') ||
      ''
    ).replace(/\/+$/, '');

    if (configuredPublicUrl) {
      return `${configuredPublicUrl}/${filePath}`;
    }

    const supabaseUrl = (
      process.env.SUPABASE_URL ||
      this.configService.get<string>('supabase.url') ||
      ''
    ).replace(/\/+$/, '');

    if (!supabaseUrl) {
      throw new BadRequestException(
        'Supabase public URL is not configured. Set SUPABASE_URL or SUPABASE_PUBLIC_STORAGE_URL.',
      );
    }

    return `${supabaseUrl}/storage/v1/object/public/${bucket}/${filePath}`;
  }

  private getSupabaseBucket(): string {
    return (
      process.env.SUPABASE_STORAGE_BUCKET ||
      this.configService.get<string>('supabase.s3.bucket') ||
      this.configService.get<string>('supabase.storageBucket') ||
      'event-apps'
    );
  }

  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    if (!file.mimetype) {
      throw new BadRequestException('File mimetype is missing');
    }

    const diskPath = (file as Express.Multer.File & { path?: string }).path;
    if (!file.buffer?.length && !(diskPath && fs.existsSync(diskPath))) {
      throw new BadRequestException('File buffer is missing');
    }
  }

  private parseBase64Image(dataUri: string): {
    buffer: Buffer;
    mimetype: string;
    extension: string;
  } {
    const matches = dataUri.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/i);
    if (!matches) {
      throw new BadRequestException('Invalid image format');
    }

    const ext = matches[1].toLowerCase();
    const normalizedExt = ext === 'jpg' ? 'jpeg' : ext;

    return {
      buffer: Buffer.from(matches[2], 'base64'),
      mimetype: `image/${normalizedExt}`,
      extension: ext === 'jpeg' ? 'jpg' : ext,
    };
  }

  private isExistingImageUrl(value: string): boolean {
    return /^https?:\/\//i.test(value) || value.startsWith('/uploads/');
  }

  private ensureDirectory(directory: string): string {
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }
    return directory;
  }

  private buildUniqueFileName(
    originalName: string,
    subfolder: string,
  ): string {
    const extension = path.extname(originalName) || '.bin';
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `${subfolder}_${timestamp}_${randomSuffix}${extension}`;
  }
}
