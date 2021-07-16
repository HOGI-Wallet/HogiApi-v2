import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { BN } from 'ethereumjs-util';

export class CreateTransactionDto {
  @IsString()
  @IsNotEmpty()
  to: string;

  @IsString()
  @IsNotEmpty()
  from: string;

  @IsString()
  @IsNotEmpty()
  amount: string;
}
