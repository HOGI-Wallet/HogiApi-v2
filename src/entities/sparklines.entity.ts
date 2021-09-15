import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type SparklinesDocument = SparklinesEntity &
  Document & {
    _id?: any;
  };

@Schema({ timestamps: true })
export class SparklinesEntity {
  _id?: any;

  @Prop()
  coinSymbol: string; // to search coin rates with coin symbol

  @Prop()
  currencyCode: string; // to search with currency code

  @Prop()
  spark_line_1_day: any[];

  @Prop()
  spark_line_7_day: any[];

  @Prop()
  spark_line_30_day: any[];

  @Prop()
  spark_line_90_day: any[];
}

export const SparklinesSchema = SchemaFactory.createForClass(SparklinesEntity);
