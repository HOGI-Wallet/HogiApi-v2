import {
  Body,
  Controller,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { CoinService } from './coin.service';
import { AdminAuthGuard } from '../auth/guards/admin.guard';
import { UpdateCoinDto } from './dto/update-coin.dto';
import { CreateCoinDto } from './dto/create-coin.dto';
import { ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';

type File = Express.Multer.File;

@ApiTags('Admin/Coin')
@Controller('/admin/coin')
export class CoinController {
  constructor(private readonly coinService: CoinService) {}

  @UseGuards(AdminAuthGuard)
  @Patch()
  async updateCoin(@Body() body: UpdateCoinDto) {
    return this.coinService.updateCoin(body);
  }

  @UseGuards(AdminAuthGuard)
  @Post()
  async createCoin(@Body() body: CreateCoinDto) {
    return this.coinService.createCoin(body);
  }

  @UseGuards(AdminAuthGuard)
  @Post('/upload-image')
  @UseGuards(AdminAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: File) {
    return this.coinService.uploadImage(file.buffer, file.originalname);
  }
}
