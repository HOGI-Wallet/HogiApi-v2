import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UnprocessableEntityException,
  Query,
} from '@nestjs/common';
import { WalletCore } from './wallet-core.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { CreatePublicinfoDto } from './dto/create-publicinfo.dto';
import { WalletService } from './wallet.service';
import { WalletInterface } from './types/wallet.interface';
import * as bip39 from 'bip39';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { CoinBalanceDto } from './dto/coin-balance.dto';

@ApiTags('Wallet')
@Controller('wallet')
export class WalletController {
  constructor(
    private readonly walletCore: WalletCore,
    private readonly walletService: WalletService,
  ) {}

  @Get('new/mnemonic')
  async generateBIP39Mnemonic() {
    return bip39.generateMnemonic();
  }

  @Post('validate/mnemonic')
  async validateBip39Mnemonic(@Body() body) {
    return bip39.validateMnemonic(body.mnemonic);
  }

  @Post('new')
  async createNewWallet(@Body() body: CreateWalletDto) {
    /** coin info */
    const coin = await this.walletService.getCoinInfo(body.coinSymbol);
    let symbol = body.coinSymbol;
    if (coin.isErc20 || coin.isBep20 || coin.coinSymbol === 'bnb') {
      symbol = 'eth';
    }
    if (!body.recovery) {
      try {
        const wallet: WalletInterface = await WalletCore.createHdWallet(
          symbol,
          body.mnemonics,
        );

        /** add public info in db for realtime balances update */
        const pubInfo = await this.walletService.addPublicInfo({
          coinSymbol: body.coinSymbol,
          hdPath: wallet.path,
          address: wallet.address,
        });

        return { ...wallet, isErc20: coin?.isErc20, isBep20: coin?.isBep20 };
      } catch (e) {
        throw new UnprocessableEntityException(e.message);
      }
    } else {
      try {
        const wallet = await this.walletCore.accountRecovery(
          coin,
          body.mnemonics,
          2,
          null,
        );
        /** add public info in db for realtime balances update */
        const pubInfo = await this.walletService.addPublicInfo({
          coinSymbol: body.coinSymbol,
          hdPath: wallet.path,
          address: wallet.address,
        });

        return { ...wallet, isErc20: coin?.isErc20, isBep20: coin?.isBep20 };
      } catch (e) {
        throw new UnprocessableEntityException(e.message);
      }
    }
  }

  @Post('publicinfo')
  async addPublicInfoForAllCoins(
    @Body() publicinfoData: CreatePublicinfoDto[],
  ) {
    console.log('new user | recovery');
    return await this.walletService.addPublicInfoForAllCoins(publicinfoData);
  }

  @ApiParam({ name: 'address' })
  @ApiParam({ name: 'coinSymbol' })
  @Get('balance/:coinSymbol/:address')
  async getMyWalletBalance(@Param() param, @Query() query) {
    return this.walletService.getMyWalletBalance(
      param.coinSymbol,
      param.address,
      query.vs_currency,
    );
  }

  @Post('balance')
  async getMyWalletBalanceFromAllCoins(
    @Body() coinBalanceData: CoinBalanceDto,
  ) {
    return await this.walletService.getMyWalletBalanceFromAllCoins(
      coinBalanceData,
    );
  }
}
