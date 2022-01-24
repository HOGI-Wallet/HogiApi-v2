import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class CreatePublicinfoDto {
  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  coinSymbol: string;

  @IsString()
  @IsNotEmpty()
  hdPath: string;

  @IsString()
  coinName?: string;
}
