import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { username: string; password: string }) {
    const user = await this.authService.login(body.username, body.password);
    if (!user) {
      return { success: false, message: 'Invalid username or password' };
    }
    return { success: true, user };
  }

  @Post('register')
  async register(@Body() body: any) {
    return this.authService.register(body);
  }

  @Get('users')
  async getAll() {
    return this.authService.getAll();
  }
}
