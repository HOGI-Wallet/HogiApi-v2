import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MoralisService } from './moralis.service';
import { SocketsService } from '../webhooks/sockets.service';
import Web3 from 'web3';
import { SyncMoralisWithDbDto } from './dto/sync-moralis-with-db.dto';
import { WalletHelper } from '../wallet/helpers/wallet.helper';

@ApiTags('Moralis')
@Controller('moralis')
export class MoralisController {
  constructor(
    private readonly walletHelper: WalletHelper,
    private readonly moralisService: MoralisService,
    private readonly socket: SocketsService,
  ) {}

  @Post('/bsc')
  async bscWebhooks(@Body() body) {
    // console.log('got binance webhook!');
    /** create tx in db
     * presumption: hooks is register for every address. if tx.outputs contains other address, safely ignore them
     */
    const tx = await this.moralisService.transformBscTx(body, 'bnb');
    await this.moralisService.createTX(tx);

    console.log('bnb trx from moralis =>', body.object);

    /** update balance in db */
    const balanceTo = await this.walletHelper.getBscBalanceRpc(
      body.object.to_address,
    );

    const balanceFrom = await this.walletHelper.getBscBalanceRpc(
      body.object.from_address,
    );

    const convertedBalanceTo = await Web3.utils.fromWei(balanceTo, 'ether');
    const convertedBalanceFrom = await Web3.utils.fromWei(balanceFrom, 'ether');

    await this.moralisService.updateBalance(
      body.object.to_address,
      convertedBalanceTo,
      'bnb',
    );

    await this.moralisService.updateBalance(
      body.object.from_address,
      convertedBalanceFrom,
      'bnb',
    );

    this.socket.emit({ coinSymbol: 'bnb' }, body.object.to_address);
  }

  @Post('/eth')
  async ethWebhooks(@Body() body) {
    // console.log('got ethereum webhook!');
    /** create tx in db
     * presumption: hooks is register for every address. if tx.outputs contains other address, safely ignore them
     */
    const tx = await this.moralisService.transformEthTx(body, 'eth');
    await this.moralisService.createTX(tx);

    console.log('eth trx from moralis =>', body.object);

    /** update balance in db */
    const balanceTo = await this.walletHelper.getEthBalanceRpc(
      body.object.to_address,
    );

    const balanceFrom = await this.walletHelper.getEthBalanceRpc(
      body.object.from_address,
    );

    const convertedBalanceTo = await Web3.utils.fromWei(balanceTo, 'ether');
    const convertedBalanceFrom = await Web3.utils.fromWei(balanceFrom, 'ether');
    await this.moralisService.updateBalance(
      body.object.to_address,
      convertedBalanceTo,
      'eth',
    );
    await this.moralisService.updateBalance(
      body.object.from_address,
      convertedBalanceFrom,
      'eth',
    );
    this.socket.emit({ coinSymbol: 'eth' }, body.object.to_address);
  }

  @Post('/token')
  async tokenWebhook(@Body() body) {
    console.log('token balance from moralis =>', body.object);
    const { coinSymbol, address } = await this.moralisService.tokenWebhook(
      body.object,
    );
    this.socket.emit({ coinSymbol }, address);
  }

  // @Post('/sync-moralis-with-db')
  // async syncMoralisWithDb(@Body() body: SyncMoralisWithDbDto) {
  //   return await this.moralisService.syncMoralisWithDb(body.update);
  // }
}
