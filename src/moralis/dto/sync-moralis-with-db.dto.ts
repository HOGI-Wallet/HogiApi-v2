import { IsBoolean, IsNotEmpty } from 'class-validator';

export class SyncMoralisWithDbDto {
  @IsBoolean()
  @IsNotEmpty()
  update: boolean;
}
