import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { SocketsService } from './sockets.service';
import { TransactionModule } from '../transaction/transaction.module';
import { BlockcypherModule } from '../blockcypher/blockcypher.module';

@Module({
  imports: [TransactionModule, BlockcypherModule],
  controllers: [WebhooksController],
  providers: [WebhooksService, SocketsService],
  exports: [SocketsService],
})
export class WebhooksModule {}
