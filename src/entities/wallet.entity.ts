import { Document, Model } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CoinEntity } from './coin.entity';

/**
 * WalletEntity store wallet information needed to be sync on mobile or any other app
 */
@Schema({ timestamps: true })
export class WalletEntity {
  _id?: string;
  @Prop()
  address: string;

  @Prop({ default: 0 })
  balance?: string;

  @Prop()
  hdPath: string; // BIP39 hd key derivation path

  @Prop()
  coinId: string;

  @Prop()
  coinSymbol: string;

  @Prop()
  isERC20: boolean;

  @Prop()
  isBEP20: boolean;

  @Prop({ default: true })
  isActive?: boolean; // if user enabled this, we will show that coin in wallets active list

  @Prop()
  updatedAt?: string; // updates on every balance update, wallet will add listener to this value for realtime update

  coin: CoinEntity; // this is used when coin is populated with that wallet

  @Prop({ default: new Date() })
  lastTxUpdate?: string;
}

export type WalletDocument = WalletEntity &
  Document & {
    _id?: any;
  };

export type WalletModel = Model<WalletDocument> & {
  updateAddressBalance?: (
    address: string,
    balance: string,
    coinSymbol: string,
  ) => void;
  updateCoinBalance?: (
    address: string,
    balance: string,
    coinSymbol: string,
  ) => void;
};

export const WalletSchema = SchemaFactory.createForClass(WalletEntity);

WalletSchema.statics.updateAddressBalance = async function (
  address: string,
  balance: string,
  coinSymbol: string,
) {
  const updated = await this.findOneAndUpdate(
    {
      address: new RegExp(`^${address}$`, 'i'),
      coinSymbol: new RegExp(`^${coinSymbol}$`, 'i'),
    },
    { balance },
    { new: true },
  );
  return updated;
};

WalletSchema.statics.updateCoinBalance = async function (
  address: string,
  balance: string,
  coinSymbol: string,
) {
  const updated = await this.findOneAndUpdate(
    {
      address: new RegExp(`^${address}$`, 'i'),
      coinSymbol: new RegExp(`^${coinSymbol}$`, 'i'),
    },
    { balance },
    { new: true },
  );
  return updated;
};

WalletSchema.virtual('coin', {
  ref: CoinEntity.name,
  localField: 'coinSymbol',
  foreignField: 'coinSymbol',
  justOne: true,
});
