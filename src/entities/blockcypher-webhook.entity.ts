import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BlockCypherWebhookDocument = BlockCypherWebhookEntity &
  Document & {
    _id: any;
  };

@Schema()
export class BlockCypherWebhookEntity {
  @Prop()
  webhookId: string;
  @Prop()
  coinSymbol: string;
  @Prop()
  address: string;
  @Prop()
  event: string;
  @Prop()
  url: string;
}

export const BlockCypherWebhookSchema = SchemaFactory.createForClass(
  BlockCypherWebhookEntity,
);
