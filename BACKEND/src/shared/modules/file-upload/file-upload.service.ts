import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

export type UploadSubfolder =
  | 'images'
  | 'profile'
  | 'forms'
  | 'venues'
  | 'vendors'
  | 'quotation'
  | 'booking';

@Injectable()
export class FileUploadService {
  private readonly uploadRoot: string;
  private readonly apiBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    const configuredFolder =
      this.configService.get<string>('upload.folder') || 'uploads';
    this.uploadRoot = path.join(process.cwd(), configuredFolder);
    this.apiBaseUrl = this.resolveApiBaseUrl();
    this.ensureDirectory(this.uploadRoot);
  }

  getApiBaseUrl(): string {
    return this.apiBaseUrl;
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

    const directory = this.ensureDirectory(path.join(this.uploadRoot, subfolder));
    const fileName = this.buildUniqueFileName(originalName, subfolder);
    const absolutePath = path.join(directory, fileName);

    fs.writeFileSync(absolutePath, buffer);

    return this.buildPublicUrl(`/uploads/${subfolder}/${fileName}`);
  }

  buildPublicUrl(relativePath: string): string {
    const normalizedPath = relativePath.startsWith('/')
      ? relativePath
      : `/${relativePath}`;

    return `${this.apiBaseUrl.replace(/\/+$/, '')}${normalizedPath}`;
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
