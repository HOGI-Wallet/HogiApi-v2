import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  AddressBookDocument,
  AddressBookEntity,
} from '../entities/address-book.entity';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressBookService {
  constructor(
    @InjectModel(AddressBookEntity.name)
    private readonly addressBookModel: Model<AddressBookDocument>,
  ) {}
  async getAddressBook(userId: string) {
    return this.addressBookModel.find({ userId }).lean();
  }
  async createAddress(addressEntry: CreateAddressDto) {
    return this.addressBookModel.create(addressEntry);
  }
  async updateAddress(addressEntry: UpdateAddressDto) {
    return this.addressBookModel.findOneAndUpdate(
      {
        _id: addressEntry._id,
        userId: addressEntry.userId,
      },
      { ...addressEntry },
      { new: true },
    );
  }
  async deleteAddress(id: string) {
    return this.addressBookModel.findOneAndDelete({ _id: id });
  }
}
