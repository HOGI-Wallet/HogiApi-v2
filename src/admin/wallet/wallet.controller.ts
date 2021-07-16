import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { GetWalletsQueryDto } from './dto/get-wallets.query.dto';
import { AdminAuthGuard } from '../auth/guards/admin.guard';
import { DailyWalletGenerationCountDto } from './dto/daily-wallet-generation-count.dto';

@Controller('admin/wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @UseGuards(AdminAuthGuard)
  @Get('')
  async getWallets(@Query() query: GetWalletsQueryDto) {
    return this.walletService.getWallets(query);
  }

  @UseGuards(AdminAuthGuard)
  @Get('totalBalance')
  async getTotalWalletBalance(@Query() query: GetWalletsQueryDto) {
    return this.walletService.getTotalWalletBalance(query);
  }
  @UseGuards(AdminAuthGuard)
  @Get('totalCount')
  async getTotalWalletCount(@Query() query: GetWalletsQueryDto) {
    return this.walletService.getTotalWalletCount(query);
  }

  @UseGuards(AdminAuthGuard)
  @Get('dailyWalletGenerated')
  async getDailyWalletGeneratedCount(
    @Query() query: DailyWalletGenerationCountDto,
  ) {
    return this.walletService.getDailyWalletGeneratedCount(query);
  }
}
