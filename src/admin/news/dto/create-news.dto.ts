import {
  IsBoolean,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FeatureImageDto } from './featured-image.dto';

export class CreateNewsDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => FeatureImageDto)
  featuredImage: FeatureImageDto;

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
