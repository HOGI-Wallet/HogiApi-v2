import { Injectable } from '@nestjs/common';
import { S3Service } from '../../globals/services/s3.service';
import { CreateDappLinkDto } from './dto/create-dapp-link.dto';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { UpdateDappLinkDto } from './dto/update-dapp-link.dto';
import {
  DappLinksDocument,
  DappLinksEntity,
} from '../../entities/dapp-links.entity';

@Injectable()
export class DappLinksService {
  constructor(
    @InjectModel(DappLinksEntity.name)
    private readonly dappLinksModel: Model<DappLinksDocument>,
    private readonly s3Service: S3Service,
  ) {}
  async getDappLinks() {
    return this.dappLinksModel.find().lean();
  }

  async getSingleDappLink(id: string) {
    return this.dappLinksModel.find({ _id: id }).lean();
  }

  async createDappLink(dappLinkEntry: CreateDappLinkDto) {
    return this.dappLinksModel.create(dappLinkEntry);
  }
  async updateDappLink(dappLinkEntry: UpdateDappLinkDto) {
    return this.dappLinksModel.findOneAndUpdate(
      { _id: dappLinkEntry._id },
      { ...dappLinkEntry },
      { new: true },
    );
  }
  async deleteDappLink(id: string) {
    return this.dappLinksModel.findOneAndDelete({ _id: id });
  }
  async uploadImage(imageBuffer: Buffer, filename: string) {
    return this.s3Service.uploadPublicFile(imageBuffer, filename);
  }
}
