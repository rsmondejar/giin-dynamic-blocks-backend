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
import { RegistrationStatus } from './interfaces/registration-status.interface';
import { HttpException } from '@nestjs/common';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { v4 as uuidv4 } from 'uuid';

describe('AuthService', () => {
  let service: AuthService;
  let jwtStrategy: JwtStrategy;
  let userService: UsersService;

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
    jwtStrategy = module.get<JwtStrategy>(JwtStrategy);
    userService = module.get<UsersService>(UsersService);
  });

  describe('validate', () => {
    it('should return error', async () => {
      const randomNameSuffix = (Math.random() + 1).toString(36).slice(2, 6);

      const payload: JwtPayload = {
        email: `email.${randomNameSuffix}@test.com`,
      };

      await expect(jwtStrategy.validate(payload)).rejects.toThrow(
        HttpException,
      );
    });

    it('should return user', async () => {
      const randomNameSuffix = (Math.random() + 1).toString(36).slice(2, 6);

      const createUserDto = {
        email: `email.${randomNameSuffix}@test.com`,
        name: `Name ${randomNameSuffix}`,
        lastName: `Lastname ${randomNameSuffix}`,
      };

      const newUser: RegistrationStatus = await service.register({
        ...createUserDto,
        password: uuidv4().toString(),
      });

      const payload: JwtPayload = {
        email: `email.${randomNameSuffix}@test.com`,
      };

      expect(await jwtStrategy.validate(payload)).toEqual(
        expect.objectContaining(createUserDto),
      );

      await userService.remove({
        id: newUser.data.id,
        authId: newUser.data.id,
      });
    });
  });
});
