import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FixedRateHistoryDocument = FixedRateHistoryEntity &
  Document & {
    _id: any;
  };

@Schema()
export class FixedRateHistoryEntity {
  @Prop()
  price?: number;
  @Prop()
  timestamp?: number;
}

export const FixedRateHistorySchema = SchemaFactory.createForClass(
  FixedRateHistoryEntity,
);
