import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateListingAlbumDto {
  @ApiProperty({ example: 'Wedding Album' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    type: [String],
    example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
  })
  @IsArray()
  @IsString({ each: true })
  images!: string[];
}

export class UpdateListingAlbumDto {
  @ApiPropertyOptional({ example: 'Wedding Album' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}

export class ListingAlbumResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ type: [String] })
  images!: string[];

  @ApiProperty()
  imageCount!: number;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
