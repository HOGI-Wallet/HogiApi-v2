import { IsNotEmpty, IsString } from 'class-validator';

export class GetAddressBookDto {
  @IsString()
  @IsNotEmpty()
  userId: string;
}
