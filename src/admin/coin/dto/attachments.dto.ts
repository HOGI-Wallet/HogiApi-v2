import { Allow, IsBoolean, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { mimeTypesArray } from '../../../globals/types/mimeTypes';
import { BucketFolder } from '../../../globals/types/awsHelper';

export class AttachmentDto {

  @IsIn(mimeTypesArray)
  type: string;

  @IsString()
  @IsNotEmpty()
  name: string;  // name of file

  @IsNotEmpty()
  @IsIn(Object.keys(BucketFolder))
  folderName: string

  @IsNotEmpty()
  @IsString()
  url: string

  @IsNotEmpty()
  @IsNumber()
  size: number

  @IsNotEmpty()
  @IsString()
  encoding: string

  @IsBoolean()
  @IsOptional()
  isTemp: boolean
}
