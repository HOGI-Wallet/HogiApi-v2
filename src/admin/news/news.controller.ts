import {
  Body,
  Controller,
  Post,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  Get,
  Req,
} from '@nestjs/common';
import { AdminAuthGuard } from '../auth/guards/admin.guard';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { NewsService } from './news.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { Multer } from 'multer';
import { CreateNewsDto } from './dto/create-news.dto';

type File = Express.Multer.File;

@ApiTags('Admin/News')
@Controller('/admin/news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @UseGuards(AdminAuthGuard)
  @Get('/')
  async getNews(@Body() body) {
    this.newsService.getNews();
  }

  @UseGuards(AdminAuthGuard)
  @Post('/create')
  createNews(@Body() body: CreateNewsDto) {
    return this.newsService.createNews(body);
  }

  @UseGuards(AdminAuthGuard)
  @Post('/upload-image')
  @UseGuards(AdminAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: File) {
    return this.newsService.uploadImage(file.buffer, file.originalname);
  }
}
