import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { FixedRateHistoryDto } from './fixed-rate-history.dto';
import { Type } from 'class-transformer';
import { AttachmentDto } from './attachments.dto';

export class UpdateCoinDto {
  @IsMongoId()
  id: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @IsOptional()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => FixedRateHistoryDto)
  fixedRateHistory: FixedRateHistoryDto[];

  @IsOptional()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => AttachmentDto)
  icon: AttachmentDto;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  feeReceivingAccount?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  coingeckoId: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  decimal: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  orderIndex: number;

  @IsOptional()
  @IsBoolean()
  isFixedRate?: boolean;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  masterWallet?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  processingFee?: string;

  @IsOptional()
  @IsNumber()
  fixedRate?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
