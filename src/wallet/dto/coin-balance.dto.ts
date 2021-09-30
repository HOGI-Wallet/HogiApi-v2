import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class WalletInfo {
  @IsString()
  @IsNotEmpty()
  coinSymbol: string;

  @IsString()
  @IsNotEmpty()
  address: string;
}

export class CoinBalanceDto {
  @IsString()
  @IsNotEmpty()
  currencyCode: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => WalletInfo)
  walletsInfo: WalletInfo[];
}
