import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class UpdateAppAlertDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsBoolean()
  showAlert: boolean;
}
