import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './guards/jwt-payload.interface';
import { InjectModel } from '@nestjs/mongoose';
import { AuthDocument, AuthEntity } from '../entities/auth.entity';
import { Model } from 'mongoose';
import { LoginCredentialsDto } from './dto/login-credentials.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(AuthEntity.name)
    private readonly authModel: Model<AuthDocument>,
    private jwtService: JwtService,
  ) {}

  async createUser(authCredentialsDto: AuthCredentialsDto) {
    try {
      const { password } = authCredentialsDto;
      const hashedPassword = await bcrypt.hash(password, 10);
      const createdUser = await this.authModel.create({
        ...authCredentialsDto,
        role: 'manager',
        password: hashedPassword,
      });
      createdUser.password = undefined;
      return createdUser;
    } catch (err) {
      if (err.message.indexOf('11000') != -1) {
        throw new HttpException(
          'User with that email already exists',
          HttpStatus.BAD_REQUEST,
        );
      }
      throw new HttpException(
        'Something went wrong',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async login(
    loginAuthCredential: LoginCredentialsDto,
  ): Promise<{ accessToken: string }> {
    const { email, password } = loginAuthCredential;
    const user = await this.authModel.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      const payload: JwtPayload = {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      };
      const accessToken: string = await this.jwtService.sign({ user: payload });
      return { accessToken };
    } else {
      throw new UnauthorizedException('Please check your login credentials');
    }
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

  async getAllUsers() {
    return this.authModel.find({ role: 'manager' }, { password: 0 }).lean();
  }

  async deleteUser(id: string) {
    return this.authModel.findOneAndDelete({ _id: id });
  }
}
