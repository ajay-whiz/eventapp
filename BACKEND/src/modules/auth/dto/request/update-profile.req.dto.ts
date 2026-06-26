import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from '@shared/enums/genderType';
import { IsOptional, IsString, IsEmail, Matches, IsEnum, IsDateString, ValidateIf } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'john', description: 'First name of the user' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'smith', description: 'Last name of the user' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: 'john@gmail.com', description: 'Email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    example: '+91',
    description: 'Optional country code with + prefix (e.g., +1, +91, +44)',
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== undefined && value !== null && value !== '')
  @IsString({ message: 'Country code must be a string' })
  @Matches(/^\+[1-9]\d{0,3}$/, {
    message: 'Country code must start with + followed by 1-4 digits (e.g., +1, +91, +44)',
  })
  countryCode?: string;

  @ApiPropertyOptional({
    example: '1234567890',
    description: 'Optional phone number without country code (7-12 digits)',
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== undefined && value !== null && value !== '')
  @IsString({ message: 'Phone number must be a string' })
  @Matches(/^[1-9]\d{6,11}$/, {
    message: 'Phone number must be 7-12 digits and cannot start with 0',
  })
  phoneNumber?: string;

  @ApiPropertyOptional({ enum: Gender, example: 'Male', description: 'Gender of the user' })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ example: '1995-12-31', description: 'Birthday in YYYY-MM-DD format' })
  @IsOptional()
  @IsDateString()
  birthday?: string;
} 