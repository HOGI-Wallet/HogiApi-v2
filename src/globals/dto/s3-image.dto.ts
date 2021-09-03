import { IsNotEmpty, IsString } from 'class-validator';

export class S3ImageDto {
  @IsNotEmpty()
  @IsString()
  url: string;

  @IsString()
  @IsNotEmpty()
  key: string;
}
