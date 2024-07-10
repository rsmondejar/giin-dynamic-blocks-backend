import { Test, TestingModule } from '@nestjs/testing';
import { FormsController } from './forms.controller';
import { FormsService } from './forms.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFormRequestDto } from './dto/create-form-request.dto';
import { UsersService } from '../users/users.service';
import { AddPermissionDto } from './dto/add-permission.dto';
import { RemovePermissionDto } from './dto/remove-permission.dto';
import { Response } from 'express';

describe('FormsController', () => {
  let controller: FormsController;
  let userService: UsersService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FormsController],
      providers: [FormsService, PrismaService, UsersService],
    }).compile();

    controller = module.get<FormsController>(FormsController);
    userService = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('create', () => {
    it('should return ok', async () => {
      const randomNameSuffix = (Math.random() + 1).toString(36).slice(2, 6);

      const newUserInfo = {
        email: `email.${randomNameSuffix}@test.com`,
        name: `Name ${randomNameSuffix}`,
        lastName: `Lastname ${randomNameSuffix}`,
        password: uuidv4().toString(),
        isAdmin: false,
      };

      const newUser = await userService.create(newUserInfo);

      const createFormDto: CreateFormRequestDto = {
        title: `Title ${randomNameSuffix}`,
        description: `Description ${randomNameSuffix}`,
        questions: [],
      };

      const req = {
        user: {
          id: newUser.id,
        },
      };

      const form = await controller.create(createFormDto, req);

      expect(form).toEqual(
        expect.objectContaining({
          authorId: newUser.id,
          title: createFormDto.title,
          description: createFormDto.description,
        }),
      );

      await controller.remove(form.id, req);
      await userService.remove({ id: newUser.id, authId: newUser.id });
    });
  });

  describe('findAll', () => {
    it('should return ok', async () => {
      const randomNameSuffix = (Math.random() + 1).toString(36).slice(2, 6);

      const newUserInfo = {
        email: `email.${randomNameSuffix}@test.com`,
        name: `Name ${randomNameSuffix}`,
        lastName: `Lastname ${randomNameSuffix}`,
        password: uuidv4().toString(),
        isAdmin: false,
      };

      const newUser = await userService.create(newUserInfo);

      const createFormDto: CreateFormRequestDto = {
        title: `Title ${randomNameSuffix}`,
        description: `Description ${randomNameSuffix}`,
        questions: [],
      };

      const req = {
        user: {
          id: newUser.id,
        },
      };

      const form = await controller.create(createFormDto, req);

      const forms = await controller.findAll(req);

      expect(forms.length).toBeGreaterThan(0);

      await controller.remove(form.id, req);
      await userService.remove({ id: newUser.id, authId: newUser.id });
    });
  });

  describe('findBySlug', () => {
    it('should return ok', async () => {
      const randomNameSuffix = (Math.random() + 1).toString(36).slice(2, 6);

      const newUserInfo = {
        email: `email.${randomNameSuffix}@test.com`,
        name: `Name ${randomNameSuffix}`,
        lastName: `Lastname ${randomNameSuffix}`,
        password: uuidv4().toString(),
        isAdmin: false,
      };

      const newUser = await userService.create(newUserInfo);

      const createFormDto: CreateFormRequestDto = {
        title: `Title ${randomNameSuffix}`,
        description: `Description ${randomNameSuffix}`,
        questions: [],
      };

      const req = {
        user: {
          id: newUser.id,
        },
      };

      const form = await controller.create(createFormDto, req);

      expect(await controller.findBySlug(form.slug)).toEqual(
        expect.objectContaining({
          title: form.title,
          description: form.description,
          slug: form.slug,
        }),
      );

      await controller.remove(form.id, req);
      await userService.remove({ id: newUser.id, authId: newUser.id });
    });
  });

  describe('findOne', () => {
    it('should return ok', async () => {
      const randomNameSuffix = (Math.random() + 1).toString(36).slice(2, 6);

      const newUserInfo = {
        email: `email.${randomNameSuffix}@test.com`,
        name: `Name ${randomNameSuffix}`,
        lastName: `Lastname ${randomNameSuffix}`,
        password: uuidv4().toString(),
        isAdmin: false,
      };

      const newUser = await userService.create(newUserInfo);

      const createFormDto: CreateFormRequestDto = {
        title: `Title ${randomNameSuffix}`,
        description: `Description ${randomNameSuffix}`,
        questions: [],
      };

      const req = {
        user: {
          id: newUser.id,
        },
      };

      const form = await controller.create(createFormDto, req);

      expect(await controller.findOne(form.id)).toEqual(
        expect.objectContaining({
          title: form.title,
          description: form.description,
          slug: form.slug,
        }),
      );

      await controller.remove(form.id, req);
      await userService.remove({ id: newUser.id, authId: newUser.id });
    });
  });

  describe('permissionsAdd', () => {
    it('should return ok', async () => {
      const randomNameSuffix = (Math.random() + 1).toString(36).slice(2, 6);

      const newUserInfo = {
        email: `email.${randomNameSuffix}@test.com`,
        name: `Name ${randomNameSuffix}`,
        lastName: `Lastname ${randomNameSuffix}`,
        password: uuidv4().toString(),
        isAdmin: false,
      };

      const newUser = await userService.create(newUserInfo);

      const createFormDto: CreateFormRequestDto = {
        title: `Title ${randomNameSuffix}`,
        description: `Description ${randomNameSuffix}`,
        questions: [],
      };

      const req = {
        user: {
          id: newUser.id,
        },
      };

      const form = await controller.create(createFormDto, req);

      const roleOwner = await prisma.role.findFirst({
        where: { type: 'owner' },
      });

      const addPermissionsDto: AddPermissionDto = {
        email: newUser.email,
        roleId: roleOwner.id,
      };

      expect(
        await controller.permissionsAdd(form.id, addPermissionsDto, req),
      ).toEqual(
        expect.objectContaining({
          formId: form.id,
          message: 'User role updated',
          roleId: roleOwner.id,
          userId: newUser.id,
        }),
      );

      await controller.remove(form.id, req);
      await userService.remove({ id: newUser.id, authId: newUser.id });
    });
  });

  describe('permissionsAdd', () => {
    it('should return ok', async () => {
      const randomNameSuffix = (Math.random() + 1).toString(36).slice(2, 6);

      const newUserInfo = {
        email: `email.${randomNameSuffix}@test.com`,
        name: `Name ${randomNameSuffix}`,
        lastName: `Lastname ${randomNameSuffix}`,
        password: uuidv4().toString(),
        isAdmin: false,
      };

      const newUser = await userService.create(newUserInfo);

      const createFormDto: CreateFormRequestDto = {
        title: `Title ${randomNameSuffix}`,
        description: `Description ${randomNameSuffix}`,
        questions: [],
      };

      const req = {
        user: {
          id: newUser.id,
        },
      };

      const form = await controller.create(createFormDto, req);

      const roleOwner = await prisma.role.findFirst({
        where: { type: 'owner' },
      });

      const addPermissionsDto: AddPermissionDto = {
        email: newUser.email,
        roleId: roleOwner.id,
      };

      expect(
        await controller.permissionsAdd(form.id, addPermissionsDto, req),
      ).toEqual(
        expect.objectContaining({
          formId: form.id,
          message: 'User role updated',
          roleId: roleOwner.id,
          userId: newUser.id,
        }),
      );

      const randomNameSuffix2 = (Math.random() + 1).toString(36).slice(2, 6);

      const newUserInfo2 = {
        email: `email.${randomNameSuffix2}@test.com`,
        name: `Name ${randomNameSuffix2}`,
        lastName: `Lastname ${randomNameSuffix2}`,
        password: uuidv4().toString(),
        isAdmin: false,
      };

      const newUser2 = await userService.create(newUserInfo2);

      const addPermissions2Dto: AddPermissionDto = {
        email: newUser2.email,
        roleId: roleOwner.id,
      };

      expect(
        await controller.permissionsAdd(form.id, addPermissions2Dto, req),
      ).toEqual(
        expect.objectContaining({
          formId: form.id,
          message: 'User role created',
          roleId: roleOwner.id,
          userId: newUser2.id,
        }),
      );

      const removePermissionsDto: RemovePermissionDto = {
        email: newUser2.email,
      };

      expect(
        await controller.permissionsRemove(form.id, removePermissionsDto, req),
      ).toEqual(
        expect.objectContaining({
          formId: form.id,
          message: 'User role deleted',
          roleId: roleOwner.id,
          userId: newUser2.id,
        }),
      );

      await controller.remove(form.id, req);
      await userService.remove({ id: newUser.id, authId: newUser.id });
      await userService.remove({ id: newUser2.id, authId: newUser2.id });
    });
  });

  describe('submissionsExportExcel', () => {
    it('should return error', async () => {
      const formID = 'invalid-id';

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
      } as Response;

      const req = {
        user: {
          id: 'invalid-id',
        },
      };

      await controller.submissionsExportExcel(formID, res, req);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
