import { IsNotEmpty, IsString } from 'class-validator';

export class FeatureImageDto {
  @IsNotEmpty()
  @IsString()
  url: string;

  @IsString()
  @IsNotEmpty()
  key: string;
}
