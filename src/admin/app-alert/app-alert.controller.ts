import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppAlertService } from './app-alert.service';
import { ApiTags } from '@nestjs/swagger';
import { CreateAppAlertDto } from './dto/create-app-alert.dto';
import { UpdateAppAlertDto } from './dto/update-app-alert.dto';

@ApiTags('Admin/App Alert')
@Controller('app-alert')
export class AppAlertController {
  constructor(private readonly appAlertService: AppAlertService) {}

  // @Post()
  // async createAppAlert(@Body() body: CreateAppAlertDto) {
  //   return await this.appAlertService.createAppAlert(body);
  // }

  @Post('/update')
  async updateAppAlert(@Body() body: UpdateAppAlertDto) {
    return await this.appAlertService.updateAppAlert(body);
  }

  @Get()
  async getAppAlert() {
    return await this.appAlertService.getAppAlert();
  }
}
