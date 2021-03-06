import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { S3ImageEntity, S3ImageSchema } from './s3-image.entity';

export type NewsDocument = NewsEntity &
  Document & {
    _id?: any;
  };

@Schema({ timestamps: true })
export class NewsEntity {
  _id?: any;

  @Prop({ type: S3ImageEntity })
  featuredImage?: S3ImageEntity;

  @Prop()
  title: string;

  @Prop()
  description: string;

  @Prop()
  content: string;

  @Prop()
  tags: string;

  @Prop()
  isFeatured: boolean;
}

export const NewsSchema = SchemaFactory.createForClass(NewsEntity);
