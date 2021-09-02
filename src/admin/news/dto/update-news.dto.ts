import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FeatureImageDto } from './featured-image.dto';

export class UpdateNewsDto {
  @IsMongoId()
  @IsNotEmpty()
  _id: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => FeatureImageDto)
  featuredImage: FeatureImageDto;

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
