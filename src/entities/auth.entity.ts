import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AuthDocument = Document & AuthEntity;

@Schema()
export class AuthEntity {
  @Prop()
  username: string;

  @Prop()
  password: string;
}

export const AuthSchema = SchemaFactory.createForClass(AuthEntity);
