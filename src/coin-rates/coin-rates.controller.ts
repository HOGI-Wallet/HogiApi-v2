import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { CoinRatesService } from './coin-rates.service';
import { ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role } from '../auth/enums/role.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Coin Rates')
@Controller('coin-rates')
export class CoinRatesController {
  constructor(private readonly coinRatesService: CoinRatesService) {}

  @ApiParam({ name: 'coinSymbol' })
  @ApiQuery({ name: 'vs_currency' })
  @Get('/:coinSymbol')
  async getCoinRate(@Query() query, @Param() param) {
    if (param.coinSymbol) {
      return this.coinRatesService.getCoinRate(
        param.coinSymbol,
        query.vs_currency,
      );
    }
  }

  @ApiParam({ name: 'coinSymbol' })
  @ApiQuery({ name: 'vs_currency' })
  @Get('sparklines/:coinSymbol')
  async getCoinSparklines(@Query() query, @Param() param) {
    if (param.coinSymbol) {
      return this.coinRatesService.getCoinSparklines(
        param.coinSymbol,
        query.vs_currency,
      );
    }
  }

  @Get('')
  async getAllCoinRates(@Query() query, @Param() param) {
    return this.coinRatesService.getAllCoinRates(query.vs_currency);
  }

  // @Roles(Role.ADMIN)
  // @UseGuards(JwtGuard, RolesGuard)
  @Get('list/coins')
  async getAllActiveCoins() {
    return this.coinRatesService.getAllActiveCoins();
  }
}
