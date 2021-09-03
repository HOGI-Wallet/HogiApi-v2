import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type S3ImageDocument = S3ImageEntity &
  Document & {
    _id: any;
  };

@Schema({ timestamps: true })
export class S3ImageEntity {
  @Prop()
  url?: string;

  @Prop()
  key?: string;
}

export const S3ImageSchema = SchemaFactory.createForClass(S3ImageEntity);
