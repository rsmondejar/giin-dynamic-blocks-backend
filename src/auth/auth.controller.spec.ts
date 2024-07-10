import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { MailerModule } from '../mailer/mailer.module';
import { UsersService } from '../users/users.service';
import { MailerService } from '../mailer/mailer.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { RegistrationStatus } from './interfaces/registration-status.interface';
import { HttpException } from '@nestjs/common';
import { LoginUserDto } from '../users/dto/login-user.dto';
import { LoginStatus } from './interfaces/login-status.interface';
import { SendResetPasswordEmailResponse } from './interfaces/send-reset-password-email-response.interface';
import { SetNewPassword } from '../users/dto/set-new-password.dto';
import { v4 as uuidv4 } from 'uuid';
import { SetResetPasswordResponse } from './interfaces/set-reset-password-response.interface';

describe('UsersController', () => {
  let controller: AuthController;
  let userService: UsersService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot(),
        UsersModule,
        PassportModule.register({
          defaultStrategy: 'jwt',
          property: 'user',
          session: false,
        }),
        JwtModule.register({
          secret: process.env.SECRETKEY,
          signOptions: {
            expiresIn: process.env.EXPIRESIN,
          },
        }),
        MailerModule,
      ],
      controllers: [AuthController],
      providers: [AuthService, PrismaService, ConfigService, UsersService, MailerService],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    userService = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('register', () => {
    it('should return error', async () => {
      const randomNameSuffix = (Math.random() + 1).toString(36).slice(2, 6);

      const createUserDto: CreateUserDto = {
        email: `email.${randomNameSuffix}@test.com`,
        name: `Name ${randomNameSuffix}`,
        lastName: `Lastname ${randomNameSuffix}`,
        password: uuidv4().toString(),
      };

      const newUser: RegistrationStatus = await controller.register(createUserDto);

      await expect(controller.register(createUserDto)).rejects.toThrow(
        HttpException,
      );

      await userService.remove({ id: newUser.data.id, authId: newUser.data.id });
    });

    it('should create a user', async () => {
      const randomNameSuffix = (Math.random() + 1).toString(36).slice(2, 6);

      const newUserInfo = {
        email: `email.${randomNameSuffix}@test.com`,
        name: `Name ${randomNameSuffix}`,
        lastName: `Lastname ${randomNameSuffix}`,
      };

      const newUser: RegistrationStatus = await controller.register({ ...newUserInfo, password: uuidv4().toString() });

      let status: RegistrationStatus = {
        success: true,
        message: 'ACCOUNT_CREATE_SUCCESS',
      };

      expect(newUser).toEqual(
        expect.objectContaining(status),
      );

      await userService.remove({ id: newUser.data.id, authId: newUser.data.id });
    });

    describe('login', () => {
      it('should return error', async () => {
        const randomNameSuffix = (Math.random() + 1).toString(36).slice(2, 6);

        const loginUserDto: LoginUserDto = {
          email: `email.${randomNameSuffix}@test.com`,
          password: uuidv4().toString(),
        };

        await expect(controller.login(loginUserDto)).rejects.toThrow(HttpException);
      });

      it('should login user', async () => {
        const randomNameSuffix = (Math.random() + 1).toString(36).slice(2, 6);

        const newUserInfo = {
          email: `email.${randomNameSuffix}@test.com`,
          name: `Name ${randomNameSuffix}`,
          lastName: `Lastname ${randomNameSuffix}`,
          password: uuidv4().toString(),
        };

        const newUser: RegistrationStatus = await controller.register(newUserInfo);

        let status: LoginStatus = {
          success: true,
          message: 'ACCOUNT_LOGIN_SUCCESS',
        };

        const loginUserDto: LoginUserDto = {
          email: newUserInfo.email,
          password: newUserInfo.password,
        };

        expect(await controller.login(loginUserDto)).toEqual(
          expect.objectContaining(status),
        );

        await userService.remove({ id: newUser.data.id, authId: newUser.data.id });
      });
    });

    describe('me', () => {
      it('should return error', async () => {
        const req = {
          user: null,
        }
        await expect(controller.me(req)).rejects.toThrow(HttpException);
      });

      it('should return user', async () => {
        const randomNameSuffix = (Math.random() + 1).toString(36).slice(2, 6);
        const newUserInfo = {
          email: `email.${randomNameSuffix}@test.com`,
          name: `Name ${randomNameSuffix}`,
          lastName: `Lastname ${randomNameSuffix}`,
        };

        const createUserDto: CreateUserDto = {
          ...newUserInfo,
          password: uuidv4().toString(),
        };

        const newUser = await userService.create(createUserDto);
        const user = await userService.findByEmail(newUser.email);

        let status: RegistrationStatus = {
          success: true,
          message: 'ACCOUNT_INFO',
        };

        const req = {
          user,
        }

        expect(await controller.me(req)).toEqual(
          expect.objectContaining(status),
        );

        await userService.remove({ id: newUser.id, authId: newUser.id });
      });
    });

    describe('sendResetPasswordEmail', () => {
      it('should return error', async () => {
        const req = {
          email: null,
        }
        await expect(controller.sendResetPasswordEmail(req)).rejects.toThrow(HttpException);
      });

      it('should return success', async () => {
        const randomNameSuffix = (Math.random() + 1).toString(36).slice(2, 6);

        const newUserInfo = {
          email: `email.${randomNameSuffix}@test.com`,
          name: `Name ${randomNameSuffix}`,
          lastName: `Lastname ${randomNameSuffix}`,
          password: uuidv4().toString(),
        };

        const newUser: RegistrationStatus = await controller.register(newUserInfo);

        const req = {
          email: newUser.data.email,
        }

        const response: SendResetPasswordEmailResponse = {
          success: true,
          message: 'PASSWORD_RESET_EMAIL_SENT',
        };

        expect(await controller.sendResetPasswordEmail(req)).toEqual(
          expect.objectContaining(response),
        );

        await userService.remove({ id: newUser.data.id, authId: newUser.data.id });
      });
    });

    describe('setNewPassword', () => {
      it('should return user not found', async () => {
        const randomNameSuffix = (Math.random() + 1).toString(36).slice(2, 6);

        const body: SetNewPassword = {
          email: `email.${randomNameSuffix}@test.com`,
          password: uuidv4().toString(),
          token: null,
        }
        await expect(controller.setNewPassword(body)).rejects.toThrow(HttpException);
      });

      it('should return user mail token not found', async () => {
        const randomNameSuffix = (Math.random() + 1).toString(36).slice(2, 6);

        const newUserInfo = {
          email: `email.${randomNameSuffix}@test.com`,
          name: `Name ${randomNameSuffix}`,
          lastName: `Lastname ${randomNameSuffix}`,
          password: uuidv4().toString(),
        };

        const newUser: RegistrationStatus = await controller.register(newUserInfo);

        const body: SetNewPassword = {
          email: newUserInfo.email,
          password: newUserInfo.password,
          token: null,
        }

        await expect(controller.setNewPassword(body)).rejects.toThrow(HttpException);

        await userService.remove({ id: newUser.data.id, authId: newUser.data.id });
      });

      it('should return success', async () => {
        const randomNameSuffix = (Math.random() + 1).toString(36).slice(2, 6);

        const newUserInfo = {
          email: `email.${randomNameSuffix}@test.com`,
          name: `Name ${randomNameSuffix}`,
          lastName: `Lastname ${randomNameSuffix}`,
          password: uuidv4().toString(),
        };

        const newUser: RegistrationStatus = await controller.register(newUserInfo);

        const resetPasswordToken = uuidv4();

        // Store reset password token
        await prisma.passwordReset.create({
          data: {
            email: newUserInfo.email,
            token: resetPasswordToken,
          },
        });

        const body: SetNewPassword = {
          email: newUserInfo.email,
          password: newUserInfo.password,
          token: resetPasswordToken,
        }

        const response: SetResetPasswordResponse = {
          success: true,
          message: 'SET_NEW_PASSWORD_SUCCESS',
        };

        const setNewPasswordResponse = await controller.setNewPassword(body);

        expect(setNewPasswordResponse).toEqual(
          expect.objectContaining(response)
        );

        await userService.remove({ id: newUser.data.id, authId: newUser.data.id });
      });
    });

  });
});
