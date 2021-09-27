import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MoralisService } from './moralis.service';
import { BscScanService } from '../transaction/bscscan.service';
import { EtherScanService } from '../transaction/etherscan.service';
import { SocketsService } from '../webhooks/sockets.service';
import Web3 from 'web3';
import { SyncMoralisWithDbDto } from './dto/sync-moralis-with-db.dto';

@ApiTags('Moralis')
@Controller('moralis')
export class MoralisController {
  constructor(
    private readonly moralisService: MoralisService,
    private readonly bscscanService: BscScanService,
    private readonly etherscanService: EtherScanService,
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
    const balance = await this.bscscanService.getBalance([
      body.object.to_address,
    ]);

    const convertedBalance = await Web3.utils.fromWei(
      String(balance[0].balance),
      'ether',
    );
    await this.moralisService.updateBalance(
      body.object.to_address,
      convertedBalance,
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
    const balance = await this.etherscanService.getBalance([
      body.object.to_address,
    ]);

    const convertedBalance = await Web3.utils.fromWei(
      String(balance[0].balance),
      'ether',
    );
    await this.moralisService.updateBalance(
      body.object.to_address,
      convertedBalance,
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
