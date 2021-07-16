import { IsNotEmpty, IsString } from 'class-validator';

export class MonitorTransactionDto {
  @IsString()
  @IsNotEmpty()
  txHash: string;

  @IsString()
  @IsNotEmpty()
  coinSymbol: string;
}
