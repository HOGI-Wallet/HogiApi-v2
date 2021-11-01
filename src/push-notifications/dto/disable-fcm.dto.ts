import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DeviceType } from '../enums/device-type.enum';

export class DisableFcmDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  udid: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(DeviceType)
  deviceType: string;
}
