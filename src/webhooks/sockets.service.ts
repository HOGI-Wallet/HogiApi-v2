import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { TransactionsEntity } from '../entities/transactions.entity';
import { WalletEntity } from '../entities/wallet.entity';

@Injectable()
@WebSocketGateway()
export class SocketsService {
  @WebSocketServer()
  private server: Server;

  emit(data: any, event: string) {
    this.server.emit(event, data);
  }

  emitTxs(txs: TransactionsEntity[]) {
    for (const tx of txs) {
      this.emit(tx, tx.to);
      this.emit(tx, tx.from);
    }
  }

  emitWalletBalances(wallets: WalletEntity[]) {
    for (const wallet of wallets) {
      this.emit(wallet, wallet.address);
    }
  }
}
