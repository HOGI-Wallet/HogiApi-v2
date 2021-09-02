import { Injectable } from '@nestjs/common';
import { S3Service } from './s3.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { Model } from 'mongoose';
import { NewsDocument, NewsEntity } from '../../entities/news.entity';
import { InjectModel } from '@nestjs/mongoose';
import { UpdateNewsDto } from './dto/update-news.dto';

@Injectable()
export class NewsService {
  constructor(
    @InjectModel(NewsEntity.name)
    private readonly newsModel: Model<NewsDocument>,
    private readonly s3Service: S3Service,
  ) {}
  async getNews() {
    return this.newsModel.find().lean();
  }
  async createNews(newsEntry: CreateNewsDto) {
    return this.newsModel.create(newsEntry);
  }
  async updateNews(newsEntry: UpdateNewsDto) {
    return this.newsModel.findOneAndUpdate(
      { _id: newsEntry._id },
      { ...newsEntry },
      { new: true },
    );
  }
  async deleteNews(id: string) {
    return this.newsModel.findOneAndDelete({ _id: id });
  }
  async uploadImage(imageBuffer: Buffer, filename: string) {
    return this.s3Service.uploadPublicFile(imageBuffer, filename);
  }
}
