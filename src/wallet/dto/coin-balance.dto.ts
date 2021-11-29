import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class WalletInfo {
  @IsString()
  @IsNotEmpty()
  coinSymbol: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsBoolean()
  @IsNotEmpty()
  isERC20: boolean;

  @IsBoolean()
  @IsNotEmpty()
  isBEP20: boolean;

  @IsString()
  @IsOptional()
  contractAddress: string;

  @IsNumber()
  @IsNotEmpty()
  rate: number;

  @IsNumber()
  @IsNotEmpty()
  decimal: number;
}

export class CoinBalanceDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => WalletInfo)
  walletsInfo: WalletInfo[];
}
