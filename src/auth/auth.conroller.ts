import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
  Request,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { RegistrationStatus } from './interfaces/registration-status.interface';
import { LoginUserDto } from '../users/dto/login-user.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginStatus } from './interfaces/login-status.interface';
import { MeStatus } from './interfaces/me-status.interface';
import { SendResetPasswordEmailResponse } from './interfaces/send-reset-password-email-response.interface';
import { SetResetPasswordResponse } from './interfaces/set-reset-password-response.interface';
import { SendNewPassword } from '../users/dto/send-new-password.dto';
import { SetNewPassword } from '../users/dto/set-new-password.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(201)
  public async register(
    @Body() createUserDto: CreateUserDto,
  ): Promise<RegistrationStatus> {
    const result: RegistrationStatus =
      await this.authService.register(createUserDto);
    if (!result.success) {
      throw new HttpException(
        result.message,
        result.statusCode || HttpStatus.BAD_REQUEST,
      );
    }
    return result;
  }

  @Post('login')
  @HttpCode(200)
  @HttpCode(400)
  @HttpCode(401)
  public async login(@Body() loginUserDto: LoginUserDto): Promise<any> {
    const result: LoginStatus = await this.authService.login(loginUserDto);
    if (!result.success) {
      throw new HttpException(
        result.message,
        result.statusCode || HttpStatus.BAD_REQUEST,
      );
    }
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @ApiSecurity('access-key')
  @UseInterceptors(ClassSerializerInterceptor)
  @Get('me')
  public async me(@Request() req): Promise<MeStatus> {
    const result: MeStatus = await this.authService.me(req.user);
    if (!result.success) {
      throw new HttpException(
        result.message,
        result.statusCode || HttpStatus.BAD_REQUEST,
      );
    }
    return result;
  }

  @Post('password/email')
  @HttpCode(200)
  @HttpCode(400)
  @HttpCode(401)
  public async sendResetPasswordEmail(
    @Body() body: SendNewPassword,
  ): Promise<SendResetPasswordEmailResponse> {
    const result: SendResetPasswordEmailResponse =
      await this.authService.sendResetPasswordEmail(body.email);

    console.log('result', result);

    if (!result.success) {
      throw new HttpException(
        result.message,
        result.statusCode || HttpStatus.BAD_REQUEST,
      );
    }
    return result;
  }

  @Post('password/reset')
  @HttpCode(200)
  @HttpCode(400)
  @HttpCode(401)
  public async setNewPassword(
    @Body() body: SetNewPassword,
  ): Promise<SetResetPasswordResponse> {
    const result: SetResetPasswordResponse =
      await this.authService.setNewPassword(body);
    if (!result.success) {
      throw new HttpException(
        result.message,
        result.statusCode || HttpStatus.BAD_REQUEST,
      );
    }
    return result;
  }
}
