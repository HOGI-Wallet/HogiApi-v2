import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DeviceType } from '../enums/device-type.enum';

export class RegisterFcmDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  udid: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fcmToken: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(DeviceType)
  deviceType: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  coinSymbol: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  address: string;
}
