import { IsNumber, IsNotEmpty } from 'class-validator';

export class FixedRateHistoryDto {
  @IsNotEmpty()
  @IsNumber()
  price: number;

  @IsNotEmpty()
  @IsNumber()
  timestamp: number;
}
