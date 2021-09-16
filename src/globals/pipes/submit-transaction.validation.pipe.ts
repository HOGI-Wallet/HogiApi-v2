import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { SendTransactionDto } from '../../transaction/dto/send-transaction.dto';
import { WalletHelper } from '../../wallet/helpers/wallet.helper';
import { SendInfuraTransactionDto } from '../../transaction/dto/send-infura-transaction.dto';
import { validate } from 'class-validator';

@Injectable()
export class SubmitTransactionValidationPipe implements PipeTransform {
  constructor(private readonly walletHelper: WalletHelper) {}

  async transform(entity: any, metadata: ArgumentMetadata) {
    if (metadata.type === 'param') {
      return entity;
    }
    if (metadata.type === 'body') {
      const coinType = await this.walletHelper.getCoinType(entity.coinSymbol);
      let errors;
      if (coinType === 'isEth' || coinType == 'isERC20') {
        const data = plainToClass(SendInfuraTransactionDto, entity);
        errors = await validate(data);
      } else {
        const data = plainToClass(SendTransactionDto, entity);
        errors = await validate(data);
      }

      if (errors?.length) {
        throw new BadRequestException({ errors });
      }

      return entity;
    }
  }
}
