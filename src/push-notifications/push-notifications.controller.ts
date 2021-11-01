import { Body, Controller, Delete, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PushNotificationsService } from './push-notifications.service';
import { RegisterFcmDto } from './dto/register-fcm.dto';
import { DisableFcmDto } from './dto/disable-fcm.dto';

@ApiTags('Push Notifications')
@Controller('push-notifications')
export class PushNotificationsController {
  constructor(
    private readonly pushNotificationService: PushNotificationsService,
  ) {}

  @Post('/register')
  async register(@Body() body: RegisterFcmDto[]) {
    return await this.pushNotificationService.register(body);
  }

  @Delete('/disable')
  async disable(@Body() body: DisableFcmDto) {
    return await this.pushNotificationService.disable(body);
  }
}
