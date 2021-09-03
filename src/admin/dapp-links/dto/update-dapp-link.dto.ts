import {
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { S3ImageDto } from '../../../globals/dto/s3-image.dto';

export class UpdateDappLinkDto {
  @IsMongoId()
  @IsNotEmpty()
  _id: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => S3ImageDto)
  image: S3ImageDto;

  @IsString()
  @IsOptional()
  title: string;

  @IsString()
  @IsOptional()
  shortDescription: string;

  @IsString()
  @IsOptional()
  url: string;
}
