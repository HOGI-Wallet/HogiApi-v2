import { IsNotEmpty, IsMongoId } from 'class-validator';

export class DeleteDappLinkDto {
  @IsMongoId()
  @IsNotEmpty()
  id: string;
}
