import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { RegistrationStatus } from './interfaces/registration-status.interface';
import { LoginUserDto } from '../users/dto/login-user.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { LoginStatus } from './interfaces/login-status.interface';
import { AuthToken } from './interfaces/auth-token.interface';
import { User } from '@prisma/client';
import { MeStatus } from './interfaces/me-status.interface';
import { UserBasicInfo } from '../users/interfaces/user-basic-info.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {
  }

  /**
   * Register
   * @param {CreateUserDto} createUserDto
   * @returns {Promise<RegistrationStatus>}
   */
  async register(createUserDto: CreateUserDto): Promise<RegistrationStatus> {
    let status: RegistrationStatus = {
      success: true,
      message: 'ACCOUNT_CREATE_SUCCESS',
    };

    try {
      status.data = await this.usersService.create(createUserDto);
    } catch (err) {
      status = {
        success: false,
        message: err,
      };
    }
    return status;
  }

  /**
   * Login
   * @param {LoginUserDto} loginUserDto
   * @returns {Promise<LoginStatus>}
   */
  async login(loginUserDto: LoginUserDto): Promise<LoginStatus> {
    let status: LoginStatus = {
      success: true,
      message: 'ACCOUNT_LOGIN_SUCCESS',
      data: {
        user: null,
        backendTokens: {
          accessToken: null,
          refreshToken: null,
        },
      },
    };

    try {
      const user: UserBasicInfo =
        await this.usersService.findByLogin(loginUserDto);

      status.data.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        lastName: user.lastName,
        createdAt: user.createdAt,
      };

      // generate and sign token
      status.data.backendTokens.accessToken = await this.createToken(
        user.email,
        process.env.JWT_EXPIRES_IN,
      );
      status.data.backendTokens.refreshToken = await this.createToken(
        user.email,
        process.env.JWT_EXPIRES_IN_REFRESH,
      );

      status.data.user.token = status.data.backendTokens.accessToken;
    } catch (err) {
      status = {
        success: false,
        message: err.response,
        statusCode: err.status,
      };
    }

    return status;
  }

  /**
   * Me
   * @param {User} user
   * @returns {Promise<MeStatus>}
   */
  async me(user: User): Promise<MeStatus> {
    let status: MeStatus = {
      success: true,
      message: 'ACCOUNT_INFO',
    };

    try {
      status.data = {
        id: user.id,
        email: user.email,
        name: user.name,
        lastName: user.lastName,
        // token: user.token,
        createdAt: user.createdAt,
      };
    } catch (err) {
      status = {
        success: false,
        message: err,
      };
    }
    return status;
  }

  /**
   * Create token
   * @param {string} email
   * @param {string|null} expiresIn
   * @returns {Promise<AuthToken>}
   */
  private async createToken(
    email: string,
    expiresIn: string = null,
  ): Promise<AuthToken> {
    const user: JwtPayload = { email };
    const Authorization = this.jwtService.sign(user, {
      expiresIn: expiresIn || process.env.JWT_EXPIRES_IN,
      secret: process.env.JWT_SECRET_KEY,
    });

    return {
      expiresIn: expiresIn || process.env.JWT_EXPIRES_IN,
      Authorization,
    };
  }

  /**
   * Validate user
   * @param {JwtPayload} payload
   * @returns {Promise<User>}
   */
  async validateUser(payload: JwtPayload): Promise<User> {
    const user = await this.usersService.findByPayload(payload);
    if (!user) {
      throw new HttpException('INVALID_TOKEN', HttpStatus.UNAUTHORIZED);
    }
    return user;
  }
}
