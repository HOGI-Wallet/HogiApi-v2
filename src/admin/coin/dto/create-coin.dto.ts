import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FixedRateHistoryDto } from './fixed-rate-history.dto';
import { UploadBodyDto } from './upload-body.dto';

export class CreateCoinDto {
  @IsString()
  @IsNotEmpty()
  blockchain: string;

  // @IsOptional()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => UploadBodyDto)
  icon: UploadBodyDto;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => FixedRateHistoryDto)
  fixedRateHistory: FixedRateHistoryDto[];

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  coinSymbol: string;

  @IsString()
  @IsNotEmpty()
  coinColor: string;

  @IsString()
  @IsNotEmpty()
  coingeckoId: string;

  @IsNumber()
  @Min(1)
  decimal: number;

  @IsNumber()
  @Min(1)
  orderIndex: number;

  @IsString()
  @IsNotEmpty()
  feeReceivingAccount: string;

  @IsBoolean()
  isFixedRate: boolean;

  @IsBoolean()
  isActive: boolean;

  @IsOptional()
  @IsNumber()
  fixedRate: number;

  @IsBoolean()
  isErc20: boolean;

  @IsString()
  @IsNotEmpty()
  masterWallet: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  processingFee: string;
}
