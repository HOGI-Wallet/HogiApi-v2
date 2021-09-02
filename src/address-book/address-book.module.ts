import { Module } from '@nestjs/common';
import { AddressBookController } from './address-book.controller';
import { AddressBookService } from './address-book.service';

@Module({
  controllers: [AddressBookController],
  providers: [AddressBookService]
})
export class AddressBookModule {}
