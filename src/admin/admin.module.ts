import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/config.service';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { CoinController } from './coin/coin.controller';
import { WalletController } from './wallet/wallet.controller';
import { CoinService } from './coin/coin.service';
import { WalletService } from './wallet/wallet.service';
import { WalletHelper } from './wallet/helpers/wallet.helper';
import { CoinRatesModule } from '../coin-rates/coin-rates.module';

@Module({
  imports: [
    CoinRatesModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.jwtSecret,
        signOptions: { expiresIn: '60d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, CoinController, WalletController],
  providers: [AuthService, CoinService, WalletService, WalletHelper],
})
export class AdminModule {}
