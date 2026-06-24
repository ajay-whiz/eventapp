import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { UpdateUserDto } from './update-user.dto';
import { CreateFeaturePermissionDto } from '@modules/role/dto/request/create-feature-permission.dto';

function parseBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }

  return Boolean(value);
}

export class CreateAdminUserDto extends UpdateUserDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => parseBoolean(value))
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @Transform(({ value }) => parseBoolean(value))
  @IsBoolean()
  isEmailVerified?: boolean;

  @ApiPropertyOptional({ type: [CreateFeaturePermissionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFeaturePermissionDto)
  features?: CreateFeaturePermissionDto[];
}
