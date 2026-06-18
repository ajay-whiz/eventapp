import {
  BadRequestException,
  Controller,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  FileUploadService,
  type UploadSubfolder,
} from './file-upload.service';

const ALLOWED_IMAGE_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
];

const ALLOWED_SUBFOLDERS: UploadSubfolder[] = [
  'images',
  'profile',
  'forms',
  'venues',
  'vendors',
  'quotation',
  'booking',
];

@ApiTags('Files')
@ApiBearerAuth()
@Controller('files')
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Post('upload')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload a file or image',
    description:
      'Stores the file in the backend upload folder and returns a public URL using API_BASE_URL.',
  })
  @ApiQuery({
    name: 'folder',
    required: false,
    description: 'Upload subfolder (default: images)',
    example: 'forms',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type: ${file.mimetype}. Allowed types: PNG, JPEG, JPG, WEBP, GIF`,
      );
    }

    const subfolder = this.resolveSubfolder(folder);
    const imageUrl = await this.fileUploadService.saveUploadedFile(
      file,
      subfolder,
    );

    return { imageUrl, url: imageUrl };
  }

  private resolveSubfolder(folder?: string): UploadSubfolder {
    if (!folder) {
      return 'images';
    }

    if (!ALLOWED_SUBFOLDERS.includes(folder as UploadSubfolder)) {
      throw new BadRequestException(
        `Invalid folder "${folder}". Allowed values: ${ALLOWED_SUBFOLDERS.join(', ')}`,
      );
    }

    return folder as UploadSubfolder;
  }
}
