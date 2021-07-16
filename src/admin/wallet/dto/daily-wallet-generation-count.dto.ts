import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class DailyWalletGenerationCountDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  coinSymbol?: string;

  @IsDateString()
  from: string;

  @IsDateString()
  to: string;
}
