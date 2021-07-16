import { Global, Module } from '@nestjs/common';
import { MongodbDatabaseProvider } from './mongodb-database.provider';

@Global()
@Module({
  imports: [...MongodbDatabaseProvider],
  exports: [...MongodbDatabaseProvider],
})
export class DatabaseModule {}
