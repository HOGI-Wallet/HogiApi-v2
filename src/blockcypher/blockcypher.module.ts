import { HttpModule, Module } from '@nestjs/common';
import { BlockcypherService } from './blockcypher.service';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [BlockcypherService],
  exports: [BlockcypherService],
})
export class BlockcypherModule {}
