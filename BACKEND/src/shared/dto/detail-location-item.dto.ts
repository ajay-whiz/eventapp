import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class DetailLocationItemDto {
  @ApiPropertyOptional({ description: 'Location record id' })
  @Expose()
  id?: string;

  @ApiProperty({ description: 'Full address' })
  @Expose()
  address: string;

  @ApiPropertyOptional({ description: 'City name' })
  @Expose()
  city?: string;

  @ApiProperty({ description: 'Latitude coordinate' })
  @Expose()
  lat: number;

  @ApiProperty({ description: 'Longitude coordinate' })
  @Expose()
  lng: number;

  @ApiPropertyOptional({ description: 'Pin title for map' })
  @Expose()
  pinTitle?: string;

  @ApiPropertyOptional({ description: 'Map image URL' })
  @Expose()
  mapImageUrl?: string;

  @ApiPropertyOptional({
    description: 'Distance from query coordinates in kilometers (2 decimal places)',
    example: 8.7,
  })
  @Expose()
  distance?: number;

  @ApiPropertyOptional({
    description: 'Unit for the distance field',
    example: 'km',
  })
  @Expose()
  distanceUnit?: string;
}
