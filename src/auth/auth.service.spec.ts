import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { JwtStrategy } from './jwt.strategy';
import { MailerService } from '../mailer/mailer.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { MailerModule } from '../mailer/mailer.module';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { RegistrationStatus } from './interfaces/registration-status.interface';
import { LoginUserDto } from '../users/dto/login-user.dto';
import { HttpException } from '@nestjs/common';
import { SetNewPassword } from '../users/dto/set-new-password.dto';
import { v4 as uuidv4 } from 'uuid';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { UserBasicInfo } from '../users/interfaces/user-basic-info.interface';
import { MeStatus } from './interfaces/me-status.interface';

describe('AuthService', () => {
  let service: AuthService;
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
      providers: [
        AuthService,
        UsersService,
        JwtStrategy,
        PrismaService,
        MailerService,
        ConfigService,
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
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
        password: 'password1234',
      };

      const newUser: RegistrationStatus = await service.register(createUserDto);

      let status: RegistrationStatus = {
        success: false,
        message: 'user_already_exists',
      };

      expect(await service.register(createUserDto)).toEqual(
        expect.objectContaining(status),
      );

      await userService.remove({ id: newUser.data.id, authId: newUser.data.id });
    });

    it('should return user', async () => {
      const randomNameSuffix = (Math.random() + 1).toString(36).slice(2, 6);

      const createUserDto: CreateUserDto = {
        email: `email.${randomNameSuffix}@test.com`,
        name: `Name ${randomNameSuffix}`,
        lastName: `Lastname ${randomNameSuffix}`,
        password: 'password1234',
      };

      let status: RegistrationStatus = {
        success: true,
        message: 'ACCOUNT_CREATE_SUCCESS',
      };

      const newUser: RegistrationStatus = await service.register(createUserDto);

      expect(newUser).toEqual(
        expect.objectContaining(status),
      );

      await userService.remove({ id: newUser.data.id, authId: newUser.data.id });
    });
  });

  describe('login', () => {
    it('should return user', async () => {
      const randomNameSuffix = (Math.random() + 1).toString(36).slice(2, 6);
      const newUserInfo = {
        email: `email.${randomNameSuffix}@test.com`,
        name: `Name ${randomNameSuffix}`,
        lastName: `Lastname ${randomNameSuffix}`,
      };

      const createUserDto: CreateUserDto = {
        ...newUserInfo,
        password: 'password1234',
      };

      const newUser: RegistrationStatus = await service.register(createUserDto);

      const loginUserDto: LoginUserDto = {
        email: newUser.data.email,
        password: createUserDto.password,
      };

      let status: RegistrationStatus = {
        success: true,
        message: 'ACCOUNT_LOGIN_SUCCESS',
      };

      expect(await service.login(loginUserDto)).toEqual(
        expect.objectContaining(status),
      );

      await userService.remove({ id: newUser.data.id, authId: newUser.data.id });
    });
  });

  describe('me', () => {
    it('should return error', async () => {
      const user = null;
      let status: MeStatus = {
        success: false,
        message: "Cannot read properties of null (reading 'id')",
      };

      expect(await service.me(user)).toEqual(
        expect.objectContaining(status),
      );
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
        password: 'password1234',
      };

      const newUser = await userService.create(createUserDto);
      const user = await userService.findByEmail(newUser.email);

      let status: RegistrationStatus = {
        success: true,
        message: 'ACCOUNT_INFO',
      };

      expect(await service.me(user)).toEqual(
        expect.objectContaining(status),
      );

      await userService.remove({ id: newUser.id, authId: newUser.id });
    });
  });

  describe('setNewPassword', () => {
    it('should return User not found', async () => {
      const randomNameSuffix = (Math.random() + 1).toString(36).slice(2, 6);

      const setNewPassword: SetNewPassword = {
        email: `email.${randomNameSuffix}@test.com`,
        password: 'password1234',
        token: 'token',
      };

      let status: RegistrationStatus = {
        success: false,
        message: 'USER_NOT_FOUND',
      };

      expect(await service.setNewPassword(setNewPassword)).toEqual(
        expect.objectContaining(status),
      );
    });

    it('should return User mail token not found', async () => {
      const randomNameSuffix = (Math.random() + 1).toString(36).slice(2, 6);
      const newUserInfo = {
        email: `email.${randomNameSuffix}@test.com`,
        name: `Name ${randomNameSuffix}`,
        lastName: `Lastname ${randomNameSuffix}`,
      };
      const password: string = 'password1234';

      const setNewPassword: SetNewPassword = {
        email: newUserInfo.email,
        password: password,
        token: 'token',
      };

      const newUser = await userService.create({ ...newUserInfo, password: password });

      let status: RegistrationStatus = {
        success: false,
        message: 'USER_MAIL_TOKEN_NOT_FOUND',
      };

      expect(await service.setNewPassword(setNewPassword)).toEqual(
        expect.objectContaining(status),
      );

      await userService.remove({ id: newUser.id, authId: newUser.id });
    });

    it('should update user password', async () => {
      const randomNameSuffix = (Math.random() + 1).toString(36).slice(2, 6);
      const newUserInfo = {
        email: `email.${randomNameSuffix}@test.com`,
        name: `Name ${randomNameSuffix}`,
        lastName: `Lastname ${randomNameSuffix}`,
        password: 'password1234',
      };

      const newUser = await userService.create(newUserInfo);

      let resetPasswordToken = uuidv4();
      const newPasswordReset = await prisma.passwordReset.create({
        data: {
          email: newUserInfo.email,
          token: resetPasswordToken,
        },
      });

      const setNewPassword: SetNewPassword = {
        email: newUserInfo.email,
        password: newUserInfo.password,
        token: resetPasswordToken,
      };

      let status: RegistrationStatus = {
        success: true,
        message: 'SET_NEW_PASSWORD_SUCCESS',
      };

      expect(await service.setNewPassword(setNewPassword)).toEqual(
        expect.objectContaining(status),
      );

      // await prisma.passwordReset.delete({
      //   where: {
      //     id: newPasswordReset.id,
      //   },
      // });

      await userService.remove({ id: newUser.id, authId: newUser.id });
    });

    describe('validateUser', () => {
      it('should return invalid token', async () => {
        const randomNameSuffix = (Math.random() + 1).toString(36).slice(2, 6);
        const payload: JwtPayload = {
          email: `email.${randomNameSuffix}@test.com`,
        };
        await expect(service.validateUser(payload)).rejects.toThrow(HttpException);
      });

      it('should return user', async () => {
        const randomNameSuffix = (Math.random() + 1).toString(36).slice(2, 6);
        const newUserInfo = {
          email: `email.${randomNameSuffix}@test.com`,
          name: `Name ${randomNameSuffix}`,
          lastName: `Lastname ${randomNameSuffix}`,
        };

        const newUser: UserBasicInfo = await userService.create({ ...newUserInfo, password: 'password1234' });
        const payload: JwtPayload = {
          email: newUser.email,
        };
        expect(await service.validateUser(payload)).toEqual(
          expect.objectContaining(newUserInfo),
        );
      });
    });

//     describe('emailTemplate', () => {
//       it('should return email template', async () => {
//         const token: string = 'token';
//         const email: string = "email@email.com"
//         const frontendUrl = configService.get<string>('FRONTEND_URL');
//         const resetPasswordUrl = `${frontendUrl}/password/reset/${token}?email=${email}`;
//         const response: string = `
// <h1 style="padding: 5px 15px;">¡Hola!</h1>
// <p style="padding: 5px 15px;">Estas recibiendo este email porque hemos recibido una solicitud de reseteo de contraseña para tu cuenta</p>
// <p style="padding: 5px 15px;">
//   <a
//      href="${resetPasswordUrl}"
//      style="display: inline-block; padding: 5px 10px; background-color: #673ab7; color: #fff;"
//      title="Resetear contraseña"
//      rel="noopener"
//    >Resetear contraseña</a>
// </p>
// <p style="padding: 5px 15px;">Si no solicitaste un reseteo de contraseña, por favor ignora este email</p>
// <p style="padding: 5px 15px;">Saludos del equipo de Dynamic Blocks</p>
// <hr/>
// <p style="padding: 5px 15px;">Si tienes problemas con el botón, copia y pega la siguiente URL en tu navegador:</p>
// <p style="padding: 5px 15px;">
//   <a
//     href="${resetPasswordUrl}"
//     style="color: #673ab7;"
//     title="Resetear contraseña"
//     rel="noopener"
//     >${resetPasswordUrl}</a>
// </p>
// `;
//
//
//         expect(service.emailTemplate(token, email)).toBe(
//           response,
//         );
//       });
//     });
  });
});
