import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { S3ImageDto } from '../../../globals/dto/s3-image.dto';

export class UpdateNewsDto {
  @IsMongoId()
  @IsNotEmpty()
  _id: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => S3ImageDto)
  featuredImage: S3ImageDto;

  @IsOptional()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  tags: string;

  @IsOptional()
  @IsBoolean()
  isFeatured: boolean;
}
