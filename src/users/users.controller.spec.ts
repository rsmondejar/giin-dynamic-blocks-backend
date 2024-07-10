import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { UserBasicInfo } from './interfaces/user-basic-info.interface';
import { UpdatePasswordUserDto } from './dto/update-password-user.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [UsersService, PrismaService],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  describe('create', () => {
    it('should create a user', async () => {
      const randomNameSuffix = (Math.random() + 1).toString(36).slice(2, 6);
      const  newUserInfo = {
        email: `email.${randomNameSuffix}@test.com`,
        name: `Name ${randomNameSuffix}`,
        lastName: `Lastname ${randomNameSuffix}`,
      }

      const newUser: UserBasicInfo = await controller.create({...newUserInfo, password: uuidv4().toString()});

      expect(newUser).toEqual(
        expect.objectContaining(newUserInfo),
      );

      await service.remove({ id: newUser.id, authId: newUser.id });
    });
  });

  describe('findAll', () => {
    it('should return users', async () => {
      const users = await controller.findAll();
      expect(users.length).toBeGreaterThan(0);
    });
  });

  describe('findOne', () => {
    it('should return a user', async () => {
      const randomNameSuffix = (Math.random() + 1).toString(36).slice(2, 6);
      const  newUserInfo = {
        email: `email.${randomNameSuffix}@test.com`,
        name: `Name ${randomNameSuffix}`,
        lastName: `Lastname ${randomNameSuffix}`,
      }

      const newUser: UserBasicInfo = await controller.create({...newUserInfo, password: uuidv4().toString()});

      expect(await controller.findOne(newUser.id)).toEqual(
        expect.objectContaining(newUserInfo),
      );

      await service.remove({ id: newUser.id, authId: newUser.id });
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      const randomNameSuffix = (Math.random() + 1).toString(36).slice(2, 6);
      const  newUserInfo = {
        email: `email.${randomNameSuffix}@test.com`,
        name: `Name ${randomNameSuffix}`,
        lastName: `Lastname ${randomNameSuffix}`,
      }

      const newUser: UserBasicInfo = await controller.create({...newUserInfo, password: uuidv4().toString()});

      const req = { user: { id: newUser.id } };

      expect(await controller.remove(newUser.id, req)).toEqual(
        expect.objectContaining({
          id: newUser.id,
        }),
      );

      await service.remove({ id: newUser.id, authId: newUser.id });
    });
  });

  describe('updatePassword', () => {
    it('should update user password', async () => {
      const randomNameSuffix = (Math.random() + 1).toString(36).slice(2, 6);
      const  newUserInfo = {
        email: `email.${randomNameSuffix}@test.com`,
        name: `Name ${randomNameSuffix}`,
        lastName: `Lastname ${randomNameSuffix}`,
      }
      const password: string = 'password1234';
      const newUser: UserBasicInfo = await controller.create({ ...newUserInfo, password: password });

      const updatePasswordDto: UpdatePasswordUserDto = {
        new_password: password,
        old_password: password,
      };

      const req = { user: { id: newUser.id } };

      expect(await controller.updatePassword(req, updatePasswordDto)).toEqual(
        expect.objectContaining({
          message: 'password_update_success',
        }),
      );

      await service.remove({ id: newUser.id, authId: newUser.id });
    });
  });
});
