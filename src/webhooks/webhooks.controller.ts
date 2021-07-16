import { Body, Controller, Param, Post } from '@nestjs/common';
import { SocketsService } from './sockets.service';
import { InjectModel } from '@nestjs/mongoose';
import {
  WalletDocument,
  WalletEntity,
  WalletModel,
} from '../entities/wallet.entity';
import { Model } from 'mongoose';
import { TransactionHelper } from '../transaction/helpers/transaction.helper';
import { BlockcypherService } from '../blockcypher/blockcypher.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly socket: SocketsService,
    @InjectModel(WalletEntity.name)
    private readonly walletModel: WalletModel,
    private readonly transactionHelper: TransactionHelper,
    private readonly blockypherService: BlockcypherService,
  ) {}
  @Post('blockCypher/hooks/callback/:coinSymbol/:address')
  async receiveBChooks(@Body() body, @Param() param) {
    /** create tx in db
     * presumption: hooks is register for every address. if tx.outputs contains other address, safely ignore them
     */
    const tx = await this.transactionHelper.createTX(
      this.transactionHelper.transformBCTx(
        param.coinSymbol,
        body,
        param.address,
      ),
    );

    /** update balance in db */
    await this.walletModel.updateAddressBalance(
      param.address,
      String(
        (
          await this.blockypherService.getBalance(
            param.coinSymbol,
            param.address,
          )
        )?.final_balance,
      ),
      param.coinSymbol,
    );
    this.socket.emit(tx, param.address);
  }
}
