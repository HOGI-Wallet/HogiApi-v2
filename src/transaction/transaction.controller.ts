import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  UsePipes,
  Req,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { SendTransactionDto } from './dto/send-transaction.dto';
import { TransactionRepo } from './transaction.repo';
import { SubmitTransactionValidationPipe } from '../globals/pipes/submit-transaction.validation.pipe';
import { MonitorTransactionDto } from './dto/monitor-transaction.dto';
import { InfuraService } from '../infura/infura.service';
import { TransactionHelper } from './helpers/transaction.helper';
import { ApiTags, ApiParam } from '@nestjs/swagger';

@ApiTags('Transactions')
@Controller('transaction')
export class TransactionController {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly transactionRepo: TransactionRepo,
    private readonly infuraService: InfuraService,
    private readonly transactionHelper: TransactionHelper,
  ) {}

  @ApiParam({ name: 'address' })
  @ApiParam({ name: 'coinSymbol' })
  @Get('/:address/:coinSymbol/txs')
  async getTransactionsOfAddress(@Param() param, @Query() query) {
    const txs = await this.transactionRepo.getTx(
      param.address,
      param.coinSymbol,
      query?.txType,
    );
    return this.transactionHelper.transformTransaction(txs);
  }

  // TODO Remove This As monitorTx Do Samething
  @ApiParam({ name: 'coinSymbol' })
  @Post('/:coinSymbol/submit')
  async sendTx(@Body() body: SendTransactionDto, @Param() param, @Req() req) {
    return this.transactionService.sendTx(param.coinSymbol, body);
  }

  @Post('monitorTx')
  async monitorTx(@Body() body: MonitorTransactionDto) {
    console.log('monitorTx =>', body);
    return this.transactionService.createSentTxInDb(
      body.txHash,
      body.coinSymbol,
    );
  }

  @ApiParam({ name: 'coinSymbol' })
  @ApiParam({ name: 'address' })
  @Get('/sync/:coinSymbol/:address')
  async sync(@Param() param) {
    return this.transactionService.sync(param.coinSymbol, param.address);
  }

  @ApiParam({ name: 'toAddress' })
  @Post('submitTx/btc/:toAddress')
  async submitTx(@Body() body, @Param('toAddress') toAddress) {
    // console.log(`addmin btx in db! for toAddress: ${toAddress} =>`, body);
    return this.transactionService.submitTxBtc(body.tx, toAddress);
  }

  /**
   * [IMPORTANT] Only for maintenance
  @Delete('invalid-timestamp')
  async deleteInvalidTimestampTrxs() {
    return this.transactionService.deleteInvalidTimestampTrxs();
  }
   */
}
