import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { UserBasicInfo } from './interfaces/user-basic-info.interface';
import { ConfigModule } from '@nestjs/config';
import { ObjectId } from 'bson';
import { HttpException } from '@nestjs/common';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UpdatePasswordUserDto } from './dto/update-password-user.dto';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      providers: [UsersService, PrismaService],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('findOne', () => {
    it('should return User not found', async () => {
      const fakeUserId: string = new ObjectId().toString();
      await expect(service.findOne(fakeUserId)).rejects.toThrow(HttpException);
    });

    it('should return a user', async () => {
      const randomNameSuffix = (Math.random() + 1).toString(36).slice(2, 6);
      const newUserInfo = {
        email: `email.${randomNameSuffix}@test.com`,
        name: `Name ${randomNameSuffix}`,
        lastName: `Lastname ${randomNameSuffix}`,
      };
      const newUser: UserBasicInfo = await service.create({ ...newUserInfo, password: 'password1234' });

      expect(await service.findOne(newUser.id)).toEqual(
        expect.objectContaining(newUserInfo),
      );

      await service.remove({ id: newUser.id, authId: newUser.id });
    });
  });

  describe('findByLogin', () => {
    it('should return User not found', async () => {
      const fakeUserId: string = new ObjectId().toString();
      await expect(service.findOne(fakeUserId)).rejects.toThrow(HttpException);
    });

    it('should return Invalid Credentials', async () => {
      const randomNameSuffix = (Math.random() + 1).toString(36).slice(2, 6);
      const newUserInfo = {
        email: `email.${randomNameSuffix}@test.com`,
        name: `Name ${randomNameSuffix}`,
        lastName: `Lastname ${randomNameSuffix}`,
      };
      const newUser: UserBasicInfo = await service.create({ ...newUserInfo, password: 'password1234' });

      await expect(service.findByLogin({ email: newUser.email, password: 'error' }))
        .rejects.toThrow(HttpException);

      await service.remove({ id: newUser.id, authId: newUser.id });
    });

    it('should return a user', async () => {
      const randomNameSuffix = (Math.random() + 1).toString(36).slice(2, 6);
      const newUserInfo = {
        email: `email.${randomNameSuffix}@test.com`,
        name: `Name ${randomNameSuffix}`,
        lastName: `Lastname ${randomNameSuffix}`,
      };
      const password: string = 'password1234';
      const newUser: UserBasicInfo = await service.create({ ...newUserInfo, password: password });

      expect(await service.findByLogin({ email: newUser.email, password: password })).toEqual(
        expect.objectContaining(newUserInfo),
      );

      await service.remove({ id: newUser.id, authId: newUser.id });
    });
  });

  describe('findByEmail', () => {
    it('should return a user', async () => {
      const randomNameSuffix = (Math.random() + 1).toString(36).slice(2, 6);
      const newUserInfo = {
        email: `email.${randomNameSuffix}@test.com`,
        name: `Name ${randomNameSuffix}`,
        lastName: `Lastname ${randomNameSuffix}`,
      };
      const newUser: UserBasicInfo = await service.create({ ...newUserInfo, password: 'password1234' });

      expect(await service.findByEmail(newUser.email)).toEqual(
        expect.objectContaining(newUserInfo),
      );

      await service.remove({ id: newUser.id, authId: newUser.id });
    });
  });

  describe('findByPayload', () => {
    it('should return a user', async () => {
      const randomNameSuffix = (Math.random() + 1).toString(36).slice(2, 6);
      const newUserInfo = {
        email: `email.${randomNameSuffix}@test.com`,
        name: `Name ${randomNameSuffix}`,
        lastName: `Lastname ${randomNameSuffix}`,
      };
      const newUser: UserBasicInfo = await service.create({ ...newUserInfo, password: 'password1234' });

      const jwtPayload: JwtPayload = { email: newUser.email };

      expect(await service.findByPayload({email: jwtPayload.email})).toEqual(
        expect.objectContaining(newUserInfo),
      );

      await service.remove({ id: newUser.id, authId: newUser.id });
    });
  });

  describe('updatePassword', () => {
    it('should return User not found', async () => {
      const fakeUserId: string = new ObjectId().toString();
      const payload: UpdatePasswordUserDto = {
        new_password: 'password1234',
        old_password: 'error',
      }
      await expect(service.updatePassword(payload, fakeUserId)).rejects.toThrow(HttpException);
    });

    it('should return Invalid Credentials', async () => {
      const randomNameSuffix = (Math.random() + 1).toString(36).slice(2, 6);
      const newUserInfo = {
        email: `email.${randomNameSuffix}@test.com`,
        name: `Name ${randomNameSuffix}`,
        lastName: `Lastname ${randomNameSuffix}`,
      };
      const newUser: UserBasicInfo = await service.create({ ...newUserInfo, password: 'password1234' });

      const payload: UpdatePasswordUserDto = {
        new_password: 'password1234',
        old_password: 'error',
      }

      await expect(service.updatePassword(payload, newUser.id))
        .rejects.toThrow(HttpException);

      await service.remove({ id: newUser.id, authId: newUser.id });
    });

    it('should return a user', async () => {
      const randomNameSuffix = (Math.random() + 1).toString(36).slice(2, 6);
      const newUserInfo = {
        email: `email.${randomNameSuffix}@test.com`,
        name: `Name ${randomNameSuffix}`,
        lastName: `Lastname ${randomNameSuffix}`,
      };
      const password: string = 'password1234';
      const newUser: UserBasicInfo = await service.create({ ...newUserInfo, password: password });

      const payload: UpdatePasswordUserDto = {
        new_password: password,
        old_password: password,
      }

      expect(await service.updatePassword(payload, newUser.id)).toEqual(
        expect.objectContaining(newUserInfo),
      );

      await service.remove({ id: newUser.id, authId: newUser.id });
    });
  });
});
