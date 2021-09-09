import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class GenerateWalletsDto {
  @IsString()
  @IsNotEmpty()
  mnemonics: string;

  @IsBoolean()
  @IsNotEmpty()
  recovery: boolean; // if true the recover account for specific coin else create new account
}
