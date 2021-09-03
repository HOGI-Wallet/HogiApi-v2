import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { S3ImageDto } from '../../../globals/dto/s3-image.dto';

export class CreateDappLinkDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => S3ImageDto)
  image: S3ImageDto;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  shortDescription: string;

  @IsString()
  @IsNotEmpty()
  url: string;
}
