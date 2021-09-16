import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AuthDocument = Document & AuthEntity;

@Schema()
export class AuthEntity {
  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  password: string;

  @Prop()
  role: string;
}

export const AuthSchema = SchemaFactory.createForClass(AuthEntity);
