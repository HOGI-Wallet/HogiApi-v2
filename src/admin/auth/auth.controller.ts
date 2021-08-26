import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AdminAuthGuard } from './guards/admin.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Admin/Auth')
@Controller('admin/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: LoginDto) {
    return this.authService.login(body.username, body.password);
  }

  @UseGuards(AdminAuthGuard)
  @Post('changePass')
  async changePassword(@Body() body: ChangePasswordDto, @Req() { user }) {
    return this.authService.changePassword(
      user.userId,
      body.newPassword,
      body.oldPassword,
    );
  }
}
