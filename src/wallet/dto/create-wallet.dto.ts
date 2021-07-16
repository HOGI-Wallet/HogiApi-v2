import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class CreateWalletDto {
  @IsString()
  coinSymbol: string; // must be lowercase

  @IsString()
  @IsNotEmpty()
  mnemonics: string;

  @IsBoolean()
  recovery: boolean; // if true the recover account for specific coin else create new account
}
