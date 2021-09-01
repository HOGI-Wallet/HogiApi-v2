import { Injectable } from '@nestjs/common';
import { S3Service } from './s3.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { Model } from 'mongoose';
import { NewsDocument, NewsEntity } from '../../entities/news.entity';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class NewsService {
  constructor(
    @InjectModel(NewsEntity.name)
    private readonly newsModel: Model<NewsDocument>,
    private readonly s3Service: S3Service,
  ) {}
  async getNews() {
    return await this.newsModel.find().lean();
  }
  async createNews(body: CreateNewsDto) {
    return await this.newsModel.create(body);
  }
  async uploadImage(imageBuffer: Buffer, filename: string) {
    return await this.s3Service.uploadPublicFile(imageBuffer, filename);
  }
}
