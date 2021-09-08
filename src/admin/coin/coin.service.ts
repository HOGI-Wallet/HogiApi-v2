import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CoinDocument, CoinEntity } from '../../entities/coin.entity';
import { Model } from 'mongoose';
import { UpdateCoinDto } from './dto/update-coin.dto';
import { CreateCoinDto } from './dto/create-coin.dto';
import { CoinRatesService } from '../../coin-rates/coin-rates.service';
import { S3Service } from '../../globals/services/s3.service';

@Injectable()
export class CoinService {
  constructor(
    @InjectModel(CoinEntity.name)
    private readonly coinModel: Model<CoinDocument>,
    private readonly coinRatesService: CoinRatesService,
    private readonly s3Service: S3Service,
  ) {}

  async createCoin(coin: CreateCoinDto) {
    const _coin = (await this.coinModel.create(coin)).toObject();

    /** update coin market data*/
    this.updateCoinMarketData(_coin);
    return _coin;
  }

  async updateCoin(coin: UpdateCoinDto) {
    let { id, ..._coin }: any = coin;
    if (_coin.fixedRateHistory) {
      _coin = {
        ..._coin,
        $push: { fixedRateHistory: _coin.fixedRateHistory },
      };
      delete _coin.fixedRateHistory;
    }

    try {
      const UpdatedCoin = await this.coinModel
        .findByIdAndUpdate(id, _coin, { new: true })
        .lean();
      if (!UpdatedCoin) {
        throw new NotFoundException({ message: 'coin not found' });
      }
      await this.updateCoinMarketData(UpdatedCoin);
    } catch (e) {
      throw new UnprocessableEntityException({
        message: e.message ?? "couldn't update coin",
      });
    }
  }

  async createAttachment(files, body) {
    const {
      fieldname,
      originalname,
      encoding,
      mimetype,
      destination,
      filename,
      path,
      size,
    } = files.file[0];
    const folderName = destination.split('/');
    const isTemp = body.coinIcon !== 'true';
    return {
      type: mimetype,
      name: filename,
      folderName: folderName[2],
      url: destination,
      size: size,
      encoding: encoding,
      isTemp: isTemp,
    };
  }
  async getCoinIcon(coinSymbol: string) {
    try {
      return await this.coinModel
        .find({
          coinSymbol,
        })
        .lean();
    } catch (e) {
      throw new NotFoundException({ message: 'coin not found' });
    }
  }

  /**
   * when new coin is added by admin
   * @param coin
   */
  async updateCoinMarketData(coin: CoinEntity) {
    /** update market data */
    const marketData = await this.coinRatesService.updateCoinRates([coin]);

    /** update sparkline data */
    const sparkLine = await this.coinRatesService.updateSparkLines([coin]);

    /** update network FEE */
    const networkFee = await this.coinRatesService.updateNetworkFee([coin]);
  }

  async uploadImage(imageBuffer: Buffer, filename: string) {
    return this.s3Service.uploadPublicFile(imageBuffer, filename);
  }
}
