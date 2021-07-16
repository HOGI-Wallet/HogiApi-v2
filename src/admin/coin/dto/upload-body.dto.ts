import { IsBoolean, IsBooleanString, IsOptional, IsString } from 'class-validator';

export class UploadBodyDto {

  @IsOptional()
  @IsBooleanString()
  coinIcon: boolean;
}