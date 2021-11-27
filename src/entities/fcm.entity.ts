import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type FCMDocument = FCMEntity &
  Document & {
    _id?: any;
  };

@Schema({ timestamps: true })
export class FCMEntity {
  _id?: any;

  @Prop({ unique: true })
  udid: string;

  @Prop()
  fcmToken: string;

  @Prop()
  deviceType: string;

  @Prop()
  coinSymbol: string;

  @Prop()
  address: string;
}

export const FCMSchema = SchemaFactory.createForClass(FCMEntity);
