import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { UserBasicInfo } from './interfaces/user-basic-info.interface';
import { ConfigModule } from '@nestjs/config';
import { ObjectId } from 'bson';
import { HttpException } from '@nestjs/common';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UpdatePasswordUserDto } from './dto/update-password-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { v4 as uuidv4 } from 'uuid';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      providers: [UsersService, PrismaService],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('create', () => {
    it('should return User already exists', async () => {
      const randomNameSuffix = (Math.random() + 1).toString(36).slice(2, 6);
      const newUserInfo: CreateUserDto = {
        email: `email.${randomNameSuffix}@test.com`,
        name: `Name ${randomNameSuffix}`,
        lastName: `Lastname ${randomNameSuffix}`,
        password: uuidv4().toString(),
      };
      const newUser: UserBasicInfo = await service.create(newUserInfo);

      await expect(service.create(newUserInfo)).rejects.toThrow(HttpException);

      await service.remove({ id: newUser.id, authId: newUser.id });
    });

    it('should return User', async () => {
      const randomNameSuffix = (Math.random() + 1).toString(36).slice(2, 6);
      const newUserInfo = {
        email: `email.${randomNameSuffix}@test.com`,
        name: `Name ${randomNameSuffix}`,
        lastName: `Lastname ${randomNameSuffix}`,
      };
      const newUser: UserBasicInfo = await service.create({
        ...newUserInfo,
        password: uuidv4().toString(),
      });

      expect(newUser).toEqual(expect.objectContaining(newUserInfo));

      await service.remove({ id: newUser.id, authId: newUser.id });
    });
  });

  describe('findAll', () => {
    it('should return users', async () => {
      const users = await service.findAll();
      expect(users.length).toBeGreaterThan(0);
    });
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
      const newUser: UserBasicInfo = await service.create({
        ...newUserInfo,
        password: uuidv4().toString(),
      });

      expect(await service.findOne(newUser.id)).toEqual(
        expect.objectContaining(newUserInfo),
      );

      await service.remove({ id: newUser.id, authId: newUser.id });
    });
  });

  describe('findByLogin', () => {
    it('should return User not found', async () => {
      const randomNameSuffix = (Math.random() + 1).toString(36).slice(2, 6);

      const fakeUser = {
        email: `email.${randomNameSuffix}@test.com`,
        password: uuidv4().toString(),
      };
      await expect(service.findByLogin(fakeUser)).rejects.toThrow(
        HttpException,
      );
    });

    it('should return Invalid Credentials', async () => {
      const randomNameSuffix = (Math.random() + 1).toString(36).slice(2, 6);
      const newUserInfo = {
        email: `email.${randomNameSuffix}@test.com`,
        name: `Name ${randomNameSuffix}`,
        lastName: `Lastname ${randomNameSuffix}`,
      };
      const newUser: UserBasicInfo = await service.create({
        ...newUserInfo,
        password: uuidv4().toString(),
      });

      await expect(
        service.findByLogin({ email: newUser.email, password: 'error' }),
      ).rejects.toThrow(HttpException);

      await service.remove({ id: newUser.id, authId: newUser.id });
    });

    it('should return a user', async () => {
      const randomNameSuffix = (Math.random() + 1).toString(36).slice(2, 6);
      const newUserInfo = {
        email: `email.${randomNameSuffix}@test.com`,
        name: `Name ${randomNameSuffix}`,
        lastName: `Lastname ${randomNameSuffix}`,
      };
      const password: string = uuidv4().toString();
      const newUser: UserBasicInfo = await service.create({
        ...newUserInfo,
        password: password,
      });

      expect(
        await service.findByLogin({ email: newUser.email, password: password }),
      ).toEqual(expect.objectContaining(newUserInfo));

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
      const newUser: UserBasicInfo = await service.create({
        ...newUserInfo,
        password: uuidv4().toString(),
      });

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
      const newUser: UserBasicInfo = await service.create({
        ...newUserInfo,
        password: uuidv4().toString(),
      });

      const jwtPayload: JwtPayload = { email: newUser.email };

      expect(await service.findByPayload({ email: jwtPayload.email })).toEqual(
        expect.objectContaining(newUserInfo),
      );

      await service.remove({ id: newUser.id, authId: newUser.id });
    });
  });

  describe('updatePassword', () => {
    it('should return User not found', async () => {
      const fakeUserId: string = new ObjectId().toString();
      const payload: UpdatePasswordUserDto = {
        new_password: uuidv4().toString(),
        old_password: 'error',
      };
      await expect(service.updatePassword(payload, fakeUserId)).rejects.toThrow(
        HttpException,
      );
    });

    it('should return Invalid Credentials', async () => {
      const randomNameSuffix = (Math.random() + 1).toString(36).slice(2, 6);
      const newUserInfo = {
        email: `email.${randomNameSuffix}@test.com`,
        name: `Name ${randomNameSuffix}`,
        lastName: `Lastname ${randomNameSuffix}`,
      };
      const newUser: UserBasicInfo = await service.create({
        ...newUserInfo,
        password: uuidv4().toString(),
      });

      const payload: UpdatePasswordUserDto = {
        new_password: uuidv4().toString(),
        old_password: 'error',
      };

      await expect(service.updatePassword(payload, newUser.id)).rejects.toThrow(
        HttpException,
      );

      await service.remove({ id: newUser.id, authId: newUser.id });
    });

    it('should return a user', async () => {
      const randomNameSuffix = (Math.random() + 1).toString(36).slice(2, 6);
      const newUserInfo = {
        email: `email.${randomNameSuffix}@test.com`,
        name: `Name ${randomNameSuffix}`,
        lastName: `Lastname ${randomNameSuffix}`,
      };
      const password: string = uuidv4().toString();
      const newUser: UserBasicInfo = await service.create({
        ...newUserInfo,
        password: password,
      });

      const payload: UpdatePasswordUserDto = {
        new_password: password,
        old_password: password,
      };

      expect(await service.updatePassword(payload, newUser.id)).toEqual(
        expect.objectContaining(newUserInfo),
      );

      await service.remove({ id: newUser.id, authId: newUser.id });
    });
  });

  describe('remove', () => {
    it('should return User not found', async () => {
      const fakeUserId: string = new ObjectId().toString();
      await expect(
        service.remove({ id: fakeUserId, authId: fakeUserId }),
      ).rejects.toThrow(HttpException);
    });

    it('should return do not have permissions', async () => {
      const fakeUserId: string = new ObjectId().toString();
      const randomNameSuffix = (Math.random() + 1).toString(36).slice(2, 6);
      const newUserInfo = {
        email: `email.${randomNameSuffix}@test.com`,
        name: `Name ${randomNameSuffix}`,
        lastName: `Lastname ${randomNameSuffix}`,
      };
      const newUser: UserBasicInfo = await service.create({
        ...newUserInfo,
        password: uuidv4().toString(),
      });

      await expect(
        service.remove({ id: newUser.id, authId: fakeUserId }),
      ).rejects.toThrow(HttpException);

      await service.remove({ id: newUser.id, authId: newUser.id });
    });

    it('should delete a user', async () => {
      const randomNameSuffix = (Math.random() + 1).toString(36).slice(2, 6);
      const newUserInfo = {
        email: `email.${randomNameSuffix}@test.com`,
        name: `Name ${randomNameSuffix}`,
        lastName: `Lastname ${randomNameSuffix}`,
      };
      const newUser: UserBasicInfo = await service.create({
        ...newUserInfo,
        password: uuidv4().toString(),
      });

      expect(
        await service.remove({ id: newUser.id, authId: newUser.id }),
      ).toEqual(
        expect.objectContaining({
          id: newUser.id,
        }),
      );
    });

    it('should delete a user by admin', async () => {
      const randomNameSuffix = (Math.random() + 1).toString(36).slice(2, 6);
      const newUserInfo = {
        email: `email.${randomNameSuffix}@test.com`,
        name: `Name ${randomNameSuffix}`,
        lastName: `Lastname ${randomNameSuffix}`,
        password: uuidv4().toString(),
      };

      const randomNameSuffixForAdminUser = (Math.random() + 1)
        .toString(36)
        .slice(2, 6);
      const newUserInfoAdmin = {
        email: `email.${randomNameSuffixForAdminUser}@test.com`,
        name: `Name ${randomNameSuffixForAdminUser}`,
        lastName: `Lastname ${randomNameSuffixForAdminUser}`,
        password: uuidv4().toString(),
        isAdmin: true,
      };

      const newUser: UserBasicInfo = await service.create(newUserInfo);
      const newUserAdmin: UserBasicInfo =
        await service.create(newUserInfoAdmin);

      expect(
        await service.remove({ id: newUser.id, authId: newUserAdmin.id }),
      ).toEqual(
        expect.objectContaining({
          id: newUser.id,
        }),
      );

      await service.remove({ id: newUserAdmin.id, authId: newUserAdmin.id });
    });
  });
});
