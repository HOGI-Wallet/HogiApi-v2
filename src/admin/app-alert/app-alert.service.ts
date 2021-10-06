import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  AppAlertDocument,
  AppAlertEntity,
} from '../../entities/app-alert.entity';
import { Model } from 'mongoose';
import { CreateAppAlertDto } from './dto/create-app-alert.dto';
import { UpdateAppAlertDto } from './dto/update-app-alert.dto';

@Injectable()
export class AppAlertService {
  constructor(
    @InjectModel(AppAlertEntity.name)
    private readonly appAlertModel: Model<AppAlertDocument>,
  ) {}

  async createAppAlert(body: CreateAppAlertDto) {
    return await this.appAlertModel.create(body);
  }

  async getAppAlert() {
    return this.appAlertModel.findOne({ _id: '615d7fc0023fe610dc4618e7' });
  }

  async updateAppAlert(body: UpdateAppAlertDto) {
    return this.appAlertModel.findOneAndUpdate(
      { _id: '615d7fc0023fe610dc4618e7' },
      { ...body },
      { new: true },
    );
  }

  async toggleAppAlert(showAlert) {
    return this.appAlertModel.findOneAndUpdate(
      { _id: '615d7fc0023fe610dc4618e7' },
      { showAlert },
      { new: true },
    );
  }
}
