import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { GetWalletsQueryDto } from './dto/get-wallets.query.dto';
import { DailyWalletGenerationCountDto } from './dto/daily-wallet-generation-count.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Admin/Wallet')
@Controller('admin/wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('')
  async getWallets(@Query() query: GetWalletsQueryDto) {
    return this.walletService.getWallets(query);
  }

  @Get('totalBalance')
  async getTotalWalletBalance(@Query() query: GetWalletsQueryDto) {
    return this.walletService.getTotalWalletBalance(query);
  }

  @Get('totalCount')
  async getTotalWalletCount(@Query() query: GetWalletsQueryDto) {
    return this.walletService.getTotalWalletCount(query);
  }

  @Get('dailyWalletGenerated')
  async getDailyWalletGeneratedCount(
    @Query() query: DailyWalletGenerationCountDto,
  ) {
    return this.walletService.getDailyWalletGeneratedCount(query);
  }
}
