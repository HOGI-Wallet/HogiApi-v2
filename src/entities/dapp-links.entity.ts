import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { S3ImageEntity, S3ImageSchema } from './s3-image.entity';

export type DappLinksDocument = DappLinksEntity &
  Document & {
    _id?: any;
  };

@Schema({ timestamps: true })
export class DappLinksEntity {
  _id?: any;

  @Prop({ type: S3ImageEntity })
  image?: S3ImageEntity;

  @Prop()
  title: string;

  @Prop()
  shortDescription: string;

  @Prop()
  url: string;
}

export const DappLinksSchema = SchemaFactory.createForClass(DappLinksEntity);
