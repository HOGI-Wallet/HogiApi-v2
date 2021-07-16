import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AuthDocument, AuthEntity } from '../../entities/auth.entity';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { NOTFOUND } from 'dns';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(AuthEntity.name)
    private readonly authModel: Model<AuthDocument>,
    private readonly jwtService: JwtService,
  ) {}

  async login(username: string, password: string) {
    /** find user */
    const user = await this.authModel.findOne({ username }).lean();
    if (!user) throw new NotFoundException({ message: 'user not found' });

    /** match password */
    const verified = bcrypt.compareSync(password, user.password);

    if (!verified)
      throw new ForbiddenException({ message: 'not authenticated' });

    /** return jwt */
    return {
      accessToken: this.jwtService.sign({ userId: user._id, role: 'admin' }),
    };
  }

  async changePassword(
    userId: string,
    newPassword: string,
    oldPassword: string,
  ) {
    try {
      /** find user */
      const user = await this.authModel.findById(userId).lean();
      if (!user) throw new NotFoundException({ message: 'user not found' });

      /** match password */
      const verified = bcrypt.compareSync(oldPassword, user.password);

      if (!verified)
        throw new ForbiddenException({ message: "password didn't match" });
      /** hash password and save it */
      const hash = bcrypt.hashSync(newPassword, 8);

      /** update user */
      const _user = await this.authModel
        .findByIdAndUpdate(userId, {
          password: hash,
        })
        .lean();

      const { password, ...__user } = _user;
      return __user;

      //TODO blacklist the previous token
    } catch (e) {
      throw e;
    }
  }
}
