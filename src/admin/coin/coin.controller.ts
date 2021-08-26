import {
  Body,
  Controller,
  Patch,
  Post,
  UseGuards,
  BadRequestException,
  UploadedFiles,
  UseInterceptors,
  HttpStatus,
  Req,
  Query,
  Get,
  Param,
  HttpException,
  Response,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CoinService } from './coin.service';
import { AdminAuthGuard } from '../auth/guards/admin.guard';
import { UpdateCoinDto } from './dto/update-coin.dto';
import { CreateCoinDto } from './dto/create-coin.dto';
import { FilesDto } from './dto/file.dto';
import { UploadBodyDto } from './dto/upload-body.dto';
import { validate } from 'class-validator';
import fs from 'fs';
import { diskStorage } from 'multer';
import path from 'path';
import { ApiParam, ApiTags } from '@nestjs/swagger';

@ApiTags('Admin/Coin')
@Controller('/admin/coin')
export class CoinController {
  constructor(private readonly coinService: CoinService) {}

  @UseGuards(AdminAuthGuard)
  @Patch()
  async updateCoin(@Body() body: UpdateCoinDto) {
    console.log('=====>', body);
    return this.coinService.updateCoin(body);
  }

  @UseGuards(AdminAuthGuard)
  @Post()
  async createCoin(@Body() body: CreateCoinDto) {
    return this.coinService.createCoin(body);
  }

  @Post('/upload')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'file', maxCount: 1 }], {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const rootDir = `./${process.env.ROOT_UPLOAD_DIR}`;
          fs.access(rootDir, function (err) {
            if (err) {
              fs.mkdir(rootDir, (err) => {
                cb(err, rootDir);
              });
            } else {
              return cb(null, rootDir);
            }
          });
        },
        filename: (req, file, cb) => {
          console.log(file);
          // let fileName = file.originalname;
          let fileName = file.originalname.split('.');
          fileName = `${fileName[0]}--${file.fieldname}--${Date.now()}.${
            fileName[1]
          }`;
          console.log(fileName);
          return cb(null, fileName);
        },
      }),
    }),
  )
  async upload(
    @UploadedFiles() files,
    @Req() req,
    @Body() body: UploadBodyDto,
  ) {
    const data = new FilesDto(files);
    const errors = await validate(data);
    if (errors && errors.length) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: errors,
        message: errors,
      });
    }
    return await this.coinService.createAttachment(data.files, body);
  }

  @ApiParam({ name: 'coinSymbol' })
  @Get(':coinSymbol')
  async getAsFile(@Param() param, @Response() res) {
    try {
      const coinIcon = await this.coinService.getCoinIcon(param.coinSymbol);
      return res.sendFile(
        path.join(
          __dirname,
          `../../../${process.env.ROOT_UPLOAD_DIR}/${coinIcon[0].icon.name}`,
        ),
      );
    } catch (e) {
      throw new HttpException('No such file exist', HttpStatus.NOT_FOUND);
    }
  }
}
