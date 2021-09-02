import { IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateAddressDto {
  @IsMongoId()
  @IsNotEmpty()
  _id: string;

  @IsString()
  @IsOptional()
  userId: string;

  @IsString()
  @IsOptional()
  contactName: string;

  @IsString()
  @IsOptional()
  address: string;

  @IsString()
  @IsOptional()
  blockchain: string;
}
