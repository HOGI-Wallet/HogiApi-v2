import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type AddressBookDocument = AddressBookEntity &
  Document & {
    _id?: any;
  };

@Schema({ timestamps: true })
export class AddressBookEntity {
  _id?: any;

  @Prop()
  userId: string;

  @Prop()
  contactName: string;

  @Prop()
  address: string;

  @Prop()
  blockchain: string;
}

export const AddressBookSchema = SchemaFactory.createForClass(
  AddressBookEntity,
);
