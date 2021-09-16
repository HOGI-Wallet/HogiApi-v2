import {
  Body,
  Controller,
  Post,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  Get,
  Req,
  Param,
  Delete,
  Patch,
} from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { NewsService } from './news.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { Multer } from 'multer';
import { CreateNewsDto } from './dto/create-news.dto';
import { DeleteNewsDto } from './dto/delete-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { MongoIdDto } from '../../globals/dto/mongo-id.dto';

type File = Express.Multer.File;

@ApiTags('Admin/News')
@Controller('/admin/news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get('/')
  async getNews(@Body() body) {
    return this.newsService.getNews();
  }

  @Get('/:id')
  async getSingleNews(@Param() params: MongoIdDto) {
    return this.newsService.getSingleNews(params.id);
  }

  @Post('/create')
  createNews(@Body() body: CreateNewsDto) {
    return this.newsService.createNews(body);
  }

  @Patch('/update')
  updateNews(@Body() body: UpdateNewsDto) {
    return this.newsService.updateNews(body);
  }

  @Delete('/delete/:id')
  deleteNews(@Param() params: DeleteNewsDto) {
    return this.newsService.deleteNews(params.id);
  }

  @Post('/upload-image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: File) {
    return this.newsService.uploadImage(file.buffer, file.originalname);
  }
}
