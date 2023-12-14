import {
  Body,
  Controller,
  Get,
  Post,
  Redirect,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiBody, ApiProperty, ApiTags } from '@nestjs/swagger';
import { LoginDto } from 'src/DTO';

@ApiTags('login')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/user/login')
  @ApiBody({ type: LoginDto })
  loginByUserName(@Body() body: { username: string; password: any }): any {
    return this.authService.loginByUserName(body);
  }
}
