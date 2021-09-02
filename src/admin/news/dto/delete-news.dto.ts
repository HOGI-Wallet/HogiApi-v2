import { IsNotEmpty, IsMongoId } from 'class-validator';

export class DeleteNewsDto {
  @IsMongoId()
  @IsNotEmpty()
  id: string;
}
