import { Test, TestingModule } from '@nestjs/testing';
import { FormsService } from './forms.service';
import { PrismaService } from '../../prisma/prisma.service';
import { HttpException } from '@nestjs/common';
import { ObjectId } from 'bson';
import { CreateFormRequestDto } from './dto/create-form-request.dto';
import { UserBasicInfo } from '../users/interfaces/user-basic-info.interface';
import { UsersService } from '../users/users.service';
import { v4 as uuidv4 } from 'uuid';

describe('FormsService', () => {
  let service: FormsService;
  let userService: UsersService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FormsService, PrismaService, UsersService],
    }).compile();

    service = module.get<FormsService>(FormsService);
    userService = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('findOne', () => {
    it('should return error invalid form id', async () => {
      await expect(service.findOne('id-error')).rejects.toThrow(HttpException);
    });

    it('should return error form not found', async () => {
      await expect(service.findOne(new ObjectId().toString())).rejects.toThrow(
        HttpException,
      );
    });

    it('should return a form', async () => {
      const randomNameSuffix = (Math.random() + 1).toString(36).slice(2, 6);

      const newUserInfo = {
        email: `email.${randomNameSuffix}@test.com`,
        name: `Name ${randomNameSuffix}`,
        lastName: `Lastname ${randomNameSuffix}`,
      };
      const newUser: UserBasicInfo = await userService.create({
        ...newUserInfo,
        password: 'password1234',
      });

      const createFormDto: CreateFormRequestDto = {
        title: `Test title ${randomNameSuffix}`,
        description: `Test description ${randomNameSuffix}`,
        authorId: newUser.id,
        questions: [],
      };

      const form = await service.create(createFormDto);

      expect(form).toEqual(expect.objectContaining(createFormDto));

      await service.delete({ formId: form.id, userId: newUser.id });
      await userService.remove({ id: newUser.id, authId: newUser.id });
    });
  });

  describe('create', () => {
    it('should create a simple form with one question without options', async () => {
      const randomNameSuffix = (Math.random() + 1).toString(36).slice(2, 6);

      const newUserInfo = {
        email: `email.${randomNameSuffix}@test.com`,
        name: `Name ${randomNameSuffix}`,
        lastName: `Lastname ${randomNameSuffix}`,
      };
      const newUser: UserBasicInfo = await userService.create({
        ...newUserInfo,
        password: 'password1234',
      });

      const createFormDto = {
        title: `Test title ${randomNameSuffix}`,
        description: `Test description ${randomNameSuffix}`,
        authorId: newUser.id,
      };

      const form = await service.create({
        ...createFormDto,
        questions: [
          {
            id: uuidv4().toString(),
            title: 'Question title',
            placeholder: 'Question placeholder',
            type: 'text',
            isRequired: true,
            options: null,
          },
        ],
      });

      expect(form).toEqual(expect.objectContaining(createFormDto));

      await service.delete({ formId: form.id, userId: newUser.id });
      await userService.remove({ id: newUser.id, authId: newUser.id });
    });

    it('should create a simple form with one question with options', async () => {
      const randomNameSuffix = (Math.random() + 1).toString(36).slice(2, 6);

      const newUserInfo = {
        email: `email.${randomNameSuffix}@test.com`,
        name: `Name ${randomNameSuffix}`,
        lastName: `Lastname ${randomNameSuffix}`,
      };
      const newUser: UserBasicInfo = await userService.create({
        ...newUserInfo,
        password: 'password1234',
      });

      const createFormDto = {
        title: `Test title ${randomNameSuffix}`,
        description: `Test description ${randomNameSuffix}`,
        authorId: newUser.id,
      };

      const form = await service.create({
        ...createFormDto,
        questions: [
          {
            id: uuidv4().toString(),
            title: 'Question title',
            placeholder: 'Question placeholder',
            type: 'select',
            isRequired: true,
            options: [
              { key: 'key1', value: 'value1' },
              { key: 'key2', value: 'value2' },
            ],
          },
        ],
      });

      expect(form).toEqual(expect.objectContaining(createFormDto));

      await service.delete({ formId: form.id, userId: newUser.id });
      await userService.remove({ id: newUser.id, authId: newUser.id });
    });
  });

  describe('findAllByUser', () => {
    it('user admin should get all forms', async () => {
      const randomNameSuffixForAdminUser = (Math.random() + 1)
        .toString(36)
        .slice(2, 6);
      const newUserInfoAdmin = {
        email: `email.${randomNameSuffixForAdminUser}@test.com`,
        name: `Name ${randomNameSuffixForAdminUser}`,
        lastName: `Lastname ${randomNameSuffixForAdminUser}`,
        password: 'password1234',
        isAdmin: true,
      };

      const newUserAdmin = await userService.create(newUserInfoAdmin);

      const user = await userService.findByPayload({
        email: newUserAdmin.email,
      });

      const forms = await service.findAllByUser(user);

      expect(forms.length).toBeGreaterThan(0);

      await userService.remove({
        id: newUserAdmin.id,
        authId: newUserAdmin.id,
      });
    });

    it('user should get all own forms', async () => {
      const randomNameSuffix = (Math.random() + 1).toString(36).slice(2, 6);
      const newUserInfo = {
        email: `email.${randomNameSuffix}@test.com`,
        name: `Name ${randomNameSuffix}`,
        lastName: `Lastname ${randomNameSuffix}`,
        password: 'password1234',
        isAdmin: false,
      };

      const newUser = await userService.create(newUserInfo);

      const user = await userService.findByPayload({ email: newUser.email });

      const createFormDto = {
        title: `Test title ${randomNameSuffix}`,
        description: `Test description ${randomNameSuffix}`,
        authorId: user.id,
      };

      const form = await service.create({
        ...createFormDto,
        questions: [
          {
            id: uuidv4().toString(),
            title: 'Question title',
            placeholder: 'Question placeholder',
            type: 'text',
            isRequired: true,
            options: null,
          },
        ],
      });

      const forms = await service.findAllByUser(user);

      expect(forms.length).toBeGreaterThan(0);

      await userService.remove({ id: newUser.id, authId: newUser.id });
      await service.delete({ formId: form.id, userId: newUser.id });
    });
  });

  describe('findBySlug', () => {
    it('should return form not found', async () => {
      await expect(service.findBySlug('slug-error')).rejects.toThrow(
        HttpException,
      );
    });

    it('should return a form', async () => {
      const randomNameSuffix = (Math.random() + 1).toString(36).slice(2, 6);
      const newUserInfo = {
        email: `email.${randomNameSuffix}@test.com`,
        name: `Name ${randomNameSuffix}`,
        lastName: `Lastname ${randomNameSuffix}`,
        password: 'password1234',
        isAdmin: false,
      };

      const newUser = await userService.create(newUserInfo);

      const user = await userService.findByPayload({ email: newUser.email });

      const createFormDto = {
        title: `Test title ${randomNameSuffix}`,
        description: `Test description ${randomNameSuffix}`,
        authorId: user.id,
        questions: [],
      };

      const form = await service.create(createFormDto);

      expect(await service.findBySlug(form.slug)).toEqual(
        expect.objectContaining({ ...createFormDto, slug: form.slug }),
      );

      await userService.remove({ id: newUser.id, authId: newUser.id });
      await service.delete({ formId: form.id, userId: newUser.id });
    });
  });

  describe('delete', () => {
    it('should return error invalid form id', async () => {
      await expect(
        service.delete({
          formId: 'id-error',
          userId: 'id-error',
        }),
      ).rejects.toThrow(HttpException);
    });

    it('should return error form not found', async () => {
      await expect(
        service.delete({
          formId: new ObjectId().toString(),
          userId: new ObjectId().toString(),
        }),
      ).rejects.toThrow(HttpException);
    });

    it('should return error form not found', async () => {
      const randomNameSuffix = (Math.random() + 1).toString(36).slice(2, 6);
      const newUserInfo = {
        email: `email.${randomNameSuffix}@test.com`,
        name: `Name ${randomNameSuffix}`,
        lastName: `Lastname ${randomNameSuffix}`,
        password: 'password1234',
        isAdmin: false,
      };

      const newUser = await userService.create(newUserInfo);

      const createFormDto = {
        title: `Test title ${randomNameSuffix}`,
        description: `Test description ${randomNameSuffix}`,
        authorId: newUser.id,
        questions: [],
      };

      const form = await service.create(createFormDto);

      await expect(
        service.delete({
          formId: form.id,
          userId: new ObjectId().toString(),
        }),
      ).rejects.toThrow(HttpException);

      await service.delete({ formId: form.id, userId: newUser.id });
    });

    it('should delete a form', async () => {
      const randomNameSuffix = (Math.random() + 1).toString(36).slice(2, 6);
      const newUserInfo = {
        email: `email.${randomNameSuffix}@test.com`,
        name: `Name ${randomNameSuffix}`,
        lastName: `Lastname ${randomNameSuffix}`,
        password: 'password1234',
        isAdmin: false,
      };

      const newUser = await userService.create(newUserInfo);

      const user = await userService.findByPayload({ email: newUser.email });

      const createFormDto = {
        title: `Test title ${randomNameSuffix}`,
        description: `Test description ${randomNameSuffix}`,
        authorId: user.id,
        questions: [],
      };

      const form = await service.create(createFormDto);

      expect(
        await service.delete({
          formId: form.id,
          userId: newUser.id,
        }),
      ).toEqual(expect.objectContaining({ id: form.id }));

      await userService.remove({ id: newUser.id, authId: newUser.id });
    });
  });
});
