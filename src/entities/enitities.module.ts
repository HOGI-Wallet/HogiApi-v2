import { MongooseModule } from '@nestjs/mongoose';
import { CoinEntity, CoinSchema } from './coin.entity';
import { CurrencyEntity, CurrencySchema } from './currency.entity';
import { RatesEntity, RatesSchema } from './rates.entity';
import { TransactionsEntity, TransactionSchema } from './transactions.entity';
import { Global, Module } from '@nestjs/common';
import { WalletEntity, WalletSchema } from './wallet.entity';
import { AuthEntity, AuthSchema } from './auth.entity';
import { NewsEntity, NewsSchema } from './news.entity';
import {
  FeaturedImageEntity,
  FeaturedImageSchema,
} from './featured-image.entity';

const entitiesArray = [
  MongooseModule.forFeature([{ name: CoinEntity.name, schema: CoinSchema }]),
  MongooseModule.forFeature([{ name: AuthEntity.name, schema: AuthSchema }]),
  MongooseModule.forFeature([
    { name: TransactionsEntity.name, schema: TransactionSchema },
  ]),
  MongooseModule.forFeature([
    { name: CurrencyEntity.name, schema: CurrencySchema },
  ]),
  MongooseModule.forFeature([{ name: RatesEntity.name, schema: RatesSchema }]),
  MongooseModule.forFeature([
    { name: WalletEntity.name, schema: WalletSchema },
  ]),
  MongooseModule.forFeature([{ name: NewsEntity.name, schema: NewsSchema }]),
  MongooseModule.forFeature([
    { name: FeaturedImageEntity.name, schema: FeaturedImageSchema },
  ]),
];

@Global()
@Module({
  imports: [...entitiesArray],
  exports: [...entitiesArray],
})
export class EntitiesModule {}
