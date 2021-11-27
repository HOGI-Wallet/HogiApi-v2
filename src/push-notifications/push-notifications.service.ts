import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FCMDocument, FCMEntity } from '../entities/fcm.entity';
import { RegisterFcmDto } from './dto/register-fcm.dto';
import { DisableFcmDto } from './dto/disable-fcm.dto';

@Injectable()
export class PushNotificationsService {
  constructor(
    @InjectModel(FCMEntity.name)
    private readonly fcmModel: Model<FCMDocument>,
  ) {}

  async register(body: RegisterFcmDto[]) {}

  async disable(body: DisableFcmDto) {}
}
