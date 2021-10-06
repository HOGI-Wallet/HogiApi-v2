import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class CreateAppAlertDto {
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
