import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Param,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AddressBookService } from './address-book.service';
import { GetAddressBookDto } from './dto/get-address-book.dto';
import { DeleteAddressBookDto } from './dto/delete-address-book.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@ApiTags('Address Book')
@Controller('address-book')
export class AddressBookController {
  constructor(private readonly addressBookService: AddressBookService) {}

  @Get('/get-address-book')
  async getAddressBook(@Body() body: GetAddressBookDto) {
    return this.addressBookService.getAddressBook(body.userId);
  }

  @Post('/create-address')
  async createAddress(@Body() body: CreateAddressDto) {
    return this.addressBookService.createAddress(body);
  }

  @Patch('update-address')
  async updateAddress(@Body() body: UpdateAddressDto) {
    return this.addressBookService.updateAddress(body);
  }

  @Delete('/delete-address/:id')
  async deleteAddress(@Param() params: DeleteAddressBookDto) {
    return this.addressBookService.deleteAddress(params.id);
  }
}
