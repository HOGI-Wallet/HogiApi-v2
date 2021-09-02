import { IsNotEmpty, IsString, IsMongoId } from 'class-validator';

export class DeleteAddressBookDto {
  @IsMongoId()
  @IsNotEmpty()
  id: string;
}
