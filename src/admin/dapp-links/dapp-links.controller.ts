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
import { AdminAuthGuard } from '../auth/guards/admin.guard';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { DappLinksService } from './dapp-links.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { Multer } from 'multer';
import { CreateDappLinkDto } from './dto/create-dapp-link.dto';
import { DeleteDappLinkDto } from './dto/delete-dapp-link.dto';
import { UpdateDappLinkDto } from './dto/update-dapp-link.dto';
import { MongoIdDto } from '../../globals/dto/mongo-id.dto';

type File = Express.Multer.File;
@ApiTags('Admin/Dapp Links')
@Controller('/admin/dapp-links')
export class DappLinksController {
  constructor(private readonly dappLinksService: DappLinksService) {}

  @Get('/')
  async getDappLinks(@Body() body) {
    return this.dappLinksService.getDappLinks();
  }

  @Get('/:id')
  async getSingleNews(@Param() params: MongoIdDto) {
    return this.dappLinksService.getSingleDappLink(params.id);
  }

  @UseGuards(AdminAuthGuard)
  @Post('/create')
  createNews(@Body() body: CreateDappLinkDto) {
    return this.dappLinksService.createDappLink(body);
  }

  @UseGuards(AdminAuthGuard)
  @Patch('/update')
  updateNews(@Body() body: UpdateDappLinkDto) {
    return this.dappLinksService.updateDappLink(body);
  }

  @UseGuards(AdminAuthGuard)
  @Delete('/delete/:id')
  deleteNews(@Param() params: DeleteDappLinkDto) {
    return this.dappLinksService.deleteDappLink(params.id);
  }

  @UseGuards(AdminAuthGuard)
  @Post('/upload-image')
  @UseGuards(AdminAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: File) {
    return this.dappLinksService.uploadImage(file.buffer, file.originalname);
  }
}
