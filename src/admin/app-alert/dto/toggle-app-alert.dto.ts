import { IsBoolean, IsNotEmpty } from 'class-validator';

export class ToggleAppAlertDto {
  @IsNotEmpty()
  @IsBoolean()
  showAlert: boolean;
}
