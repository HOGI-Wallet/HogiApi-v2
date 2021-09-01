import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FeaturedImageDocument = FeaturedImageEntity &
  Document & {
    _id: any;
  };

@Schema({ timestamps: true })
export class FeaturedImageEntity {
  @Prop()
  url?: string;

  @Prop()
  key?: string;
}

export const FeaturedImageSchema = SchemaFactory.createForClass(
  FeaturedImageEntity,
);
