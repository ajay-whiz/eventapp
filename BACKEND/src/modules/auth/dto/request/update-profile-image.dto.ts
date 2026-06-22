import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class UpdateProfileImageDto {
  @ApiProperty({
    description: 'Base64 image string with data URI. Server uploads to Supabase and returns a public URL.',
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
  })
  @IsString()
  @Matches(/^data:image\/(png|jpeg|jpg);base64,/, { message: 'Invalid base64 format' })
  profileImage!: string;
}