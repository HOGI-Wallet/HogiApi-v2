import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type AppAlertDocument = AppAlertEntity &
  Document & {
    _id?: any;
  };

@Schema({ timestamps: true })
export class AppAlertEntity {
  _id?: any;

  @Prop()
  title: string;

  @Prop()
  description: string;

  @Prop()
  showAlert: boolean;
}

export const AppAlertSchema = SchemaFactory.createForClass(AppAlertEntity);
