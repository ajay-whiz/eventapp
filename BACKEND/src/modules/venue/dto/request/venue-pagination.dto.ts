import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsOptional, IsNumber, IsString, Min, Max } from 'class-validator';

export class VenuePaginationDto {
  @ApiProperty({ 
    description: 'Page number (starts from 1)', 
    example: 1, 
    default: 1,
    minimum: 1
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ 
    description: 'Number of items per page', 
    example: 10, 
    default: 10,
    minimum: 1,
    maximum: 100
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiProperty({ 
    description: 'Search term to filter venues by name or location', 
    required: false,
    example: 'wedding hall'
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ 
    description: 'Filter by category ObjectId', 
    required: false,
    example: '507f1f77bcf86cd799439011'
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({
    description: 'User latitude for sorting locations by nearest distance',
    required: false,
    example: 37.785834,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value == null) return undefined;
    const num = Number(value);
    return Number.isFinite(num) ? num : value;
  })
  @Type(() => Number)
  @IsNumber()
  lat?: number;

  @ApiProperty({
    description: 'User longitude for sorting locations by nearest distance',
    required: false,
    example: -122.406417,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value == null) return undefined;
    const num = Number(value);
    return Number.isFinite(num) ? num : value;
  })
  @Type(() => Number)
  @IsNumber()
  lng?: number;
}