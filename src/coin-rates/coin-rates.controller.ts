import { Controller, Get, Param, Query } from '@nestjs/common';
import { CoinRatesService } from './coin-rates.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Coin Rates')
@Controller('coin-rates')
export class CoinRatesController {
  constructor(private readonly coinRatesService: CoinRatesService) {}

  @Get('/:coinSymbol')
  async getCoinRate(@Query() query, @Param() param) {
    if (param.coinSymbol) {
      return this.coinRatesService.getCoinRate(
        param.coinSymbol,
        query.vs_currency,
      );
    }
  }

  @Get('')
  async getAllCoinRates(@Query() query, @Param() param) {
    return this.coinRatesService.getAllCoinRates(query.vs_currency);
  }

  @Get('list/coins')
  async getAllActiveCoins() {
    return this.coinRatesService.getAllActiveCoins();
  }
}
