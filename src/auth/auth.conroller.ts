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
}
