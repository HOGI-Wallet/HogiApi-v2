/**
 * use to send tx to blockcypher
 */
import { IsHexadecimal, IsObject, IsOptional, IsString } from 'class-validator';

export class SendTransactionDto {
  @IsObject()
  @IsOptional()
  tx: any;

  @IsString({ each: true })
  @IsOptional()
  tosign: string[];

  @IsString({ each: true })
  @IsOptional()
  pubKeys: string[];

  @IsString({ each: true })
  @IsOptional()
  signatures: string[];

  @IsHexadecimal()
  @IsOptional()
  serializedTX: string; // used for ether
}
