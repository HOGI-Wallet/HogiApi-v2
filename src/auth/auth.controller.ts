import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
  Get,
  Delete,
  Param,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { LoginCredentialsDto } from './dto/login-credentials.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/create-user')
  createUser(@Body() authCredentialsDto: AuthCredentialsDto) {
    return this.authService.createUser(authCredentialsDto);
  }

  @Post('/login')
  login(
    @Body() loginCredentialsDto: LoginCredentialsDto,
  ): Promise<{ accessToken: string }> {
    return this.authService.login(loginCredentialsDto);
  }

  @Post('/change-password')
  async changePassword(@Body() body: ChangePasswordDto, @Req() { user }) {
    return this.authService.changePassword(
      user.userId,
      body.newPassword,
      body.oldPassword,
    );
  }

  @Get('/all-users')
  async getAllUsers() {
    return this.authService.getAllUsers();
  }

  @ApiParam({ name: 'id' })
  @Delete('/delete-user/:id')
  async deleteUser(@Param() params) {
    return this.authService.deleteUser(params.id);
  }
}
