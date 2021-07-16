import { IsOptional, IsString } from 'class-validator';

export class GetWalletsQueryDto {
  @IsOptional()
  @IsString()
  coinSymbol?: string;

}
