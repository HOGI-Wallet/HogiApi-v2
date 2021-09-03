import {
  IsBoolean,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { S3ImageDto } from '../../../globals/dto/s3-image.dto';

export class CreateNewsDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => S3ImageDto)
  featuredImage: S3ImageDto;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  tags: string;

  @IsBoolean()
  @IsNotEmpty()
  isFeatured: boolean;
}
