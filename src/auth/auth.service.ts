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
import { v4 as uuidv4 } from 'uuid';
import { MailerService } from '../mailer/mailer.service';
import { SendEmailDto } from '../mailer/interfaces/mail.interface';
import { ConfigService } from '@nestjs/config';
import { SetNewPassword } from '../users/dto/set-new-password.dto';
import { SendResetPasswordEmailResponse } from './interfaces/send-reset-password-email-response.interface';
import { SetResetPasswordResponse } from './interfaces/set-reset-password-response.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { hash } from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly mailerService: MailerService,
  ) {}

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
        this.configService.get<string>('JWT_EXPIRES_IN'),
      );
      status.data.backendTokens.refreshToken = await this.createToken(
        user.email,
        this.configService.get<string>('JWT_EXPIRES_IN_REFRESH'),
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

  async sendResetPasswordEmail(
    email: string,
  ): Promise<SendResetPasswordEmailResponse> {
    let status: SendResetPasswordEmailResponse = {
      success: true,
      message: 'PASSWORD_RESET_EMAIL_SENT',
    };

    try {
      // Find user by email
      const user: User = await this.usersService.findByEmail(email);
      if (!user) {
        throw new HttpException('USER_NOT_FOUND', HttpStatus.NOT_FOUND);
      }

      // Check if exists reset password
      const passwordReset = await this.prisma.passwordReset.findFirst({
        where: { email: email },
      });

      let resetPasswordToken = '';
      if (passwordReset) {
        resetPasswordToken = passwordReset.token;
      } else {
        // Send email with reset password link
        resetPasswordToken = uuidv4();

        // Store reset password token
        await this.prisma.passwordReset.create({
          data: {
            email: email,
            token: resetPasswordToken,
          },
        });
      }

      const options: SendEmailDto = {
        recipients: [{ name: user.name, address: email }],
        subject: 'Reset password',
        html: this.emailTemplate(resetPasswordToken, email),
      };

      // Send email with reset password link
      await this.mailerService.sendMail(options);

      return status;
    } catch (err) {
      status = {
        success: false,
        message: err.message,
      };
    }
    return status;
  }

  async setNewPassword(
    setNewPassword: SetNewPassword,
  ): Promise<SetResetPasswordResponse> {
    let status: SetResetPasswordResponse = {
      success: true,
      message: 'SET_NEW_PASSWORD_SUCCESS',
    };

    try {
      // Find user by email
      const user: User = await this.usersService.findByEmail(
        setNewPassword.email,
      );
      if (!user) {
        throw new HttpException('USER_NOT_FOUND', HttpStatus.NOT_FOUND);
      }

      // Find user by email and token
      const emailToken = await this.prisma.passwordReset.findFirst({
        where: {
          email: setNewPassword.email,
          token: setNewPassword.token,
        },
      });
      if (!emailToken) {
        throw new HttpException(
          'USER_MAIL_TOKEN_NOT_FOUND',
          HttpStatus.NOT_FOUND,
        );
      }

      // Set new user password
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          password: await hash(setNewPassword.password, 10),
          updatedAt: new Date(),
        },
      });

      // Delete password reset
      await this.prisma.passwordReset.delete({
        where: {
          id: emailToken.id,
        },
      });

      return status;
    } catch (err) {
      status = {
        success: false,
        message: err.message,
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
    if (!expiresIn) {
      expiresIn = this.configService.get<string>('JWT_EXPIRES_IN');
    }
    const user: JwtPayload = { email };
    const Authorization = this.jwtService.sign(user, {
      expiresIn: expiresIn,
      secret: this.configService.get<string>('JWT_SECRET_KEY'),
    });

    return {
      expiresIn: expiresIn,
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

  private emailTemplate(token: string, email: string) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const resetPasswordUrl = `${frontendUrl}/password/reset/${token}?email=${email}`;
    return `
    <h1 style="padding: 5px 15px;">¡Hola!</h1>
    <p style="padding: 5px 15px;">Estas recibiendo este email porque hemos recibido una solicitud de reseteo de contraseña para tu cuenta</p>
    <p style="padding: 5px 15px;">
      <a
         href="${resetPasswordUrl}"
         style="display: inline-block; padding: 5px 10px; background-color: #673ab7; color: #fff;"
         title="Resetear contraseña"
         rel="noopener"
       >Resetear contraseña</a>
    </p>
    <p style="padding: 5px 15px;">Si no solicitaste un reseteo de contraseña, por favor ignora este email</p>
    <p style="padding: 5px 15px;">Saludos del equipo de Dynamic Blocks</p>
    <hr/>
    <p style="padding: 5px 15px;">Si tienes problemas con el botón, copia y pega la siguiente URL en tu navegador:</p>
    <p style="padding: 5px 15px;">
      <a
        href="${resetPasswordUrl}"
        style="color: #673ab7;"
        title="Resetear contraseña"
        rel="noopener"
        >${resetPasswordUrl}</a>
    </p>
    `;
  }
}
