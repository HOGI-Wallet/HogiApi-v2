import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  FeaturedImageEntity,
  FeaturedImageSchema,
} from './featured-image.entity';

export type NewsDocument = NewsEntity &
  Document & {
    _id?: any;
  };

@Schema({ timestamps: true })
export class NewsEntity {
  _id?: any;

  @Prop({ type: FeaturedImageEntity })
  featuredImage?: FeaturedImageEntity;

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
