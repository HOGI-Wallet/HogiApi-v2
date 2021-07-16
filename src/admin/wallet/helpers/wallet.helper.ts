import { Injectable } from '@nestjs/common';
import { WalletEntity } from '../../../entities/wallet.entity';

@Injectable()
export class WalletHelper {
  getTotalBalance(wallets: WalletEntity[]) {
    return wallets.reduce((totalBalance, currentWallet) => {
      totalBalance +=
        currentWallet.balance !== 'undefined'
          ? Number(currentWallet.balance)
          : 0;
      return totalBalance;
    }, 0);
  }
}
