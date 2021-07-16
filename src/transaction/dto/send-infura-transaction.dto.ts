import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class SendInfuraTransactionDto {
  @IsString()
  @IsNotEmpty()
  coinSymbol: string;

  @IsString()
  @IsNotEmpty()
  to: string;

  @IsNumber()
  @Min(1)
  value: number; // value in wie

  @IsNumber()
  @Min(1)
  gas: number;

  @IsNumber()
  @Min(1)
  gasPrice: number;

  @IsNumber()
  @Min(1)
  nonce: number;

  @IsNumber()
  @Min(1)
  chainId: number;
}
