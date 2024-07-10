import { Test, TestingModule } from '@nestjs/testing';
import { FormsService } from './forms.service';
import { PrismaService } from '../../prisma/prisma.service';
import { HttpException } from '@nestjs/common';
import { ObjectId } from 'bson';
import { CreateFormRequestDto } from './dto/create-form-request.dto';
import { UserBasicInfo } from '../users/interfaces/user-basic-info.interface';
import { UsersService } from '../users/users.service';
import { v4 as uuidv4 } from 'uuid';
import { Workbook } from 'exceljs';
import { FormsSubmissionsService } from '../forms-submissions/forms-submissions.service';
import { CreateFormsSubmissionDto } from '../forms-submissions/dto/create-forms-submission.dto';
import { AddPermissionDto } from './dto/add-permission.dto';
import { RemovePermissionDto } from './dto/remove-permission.dto';

describe('FormsService', () => {
  let service: FormsService;
  let userService: UsersService;
  let formsSubmissionsService: FormsSubmissionsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FormsService,
        PrismaService,
        UsersService,
        FormsSubmissionsService,
      ],
    }).compile();

    service = module.get<FormsService>(FormsService);
    userService = module.get<UsersService>(UsersService);
    formsSubmissionsService = module.get<FormsSubmissionsService>(
      FormsSubmissionsService,
    );
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
        password: uuidv4().toString(),
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
        password: uuidv4().toString(),
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
        password: uuidv4().toString(),
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
        password: uuidv4().toString(),
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
        password: uuidv4().toString(),
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
        password: uuidv4().toString(),
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
        password: uuidv4().toString(),
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
        password: uuidv4().toString(),
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

  describe('submissionsExportExcel', () => {
    it('should return error invalid form id', async () => {
      await expect(
        service.submissionsExportExcel('id-error', 'id-error'),
      ).rejects.toThrow(HttpException);
    });

    it('should return error form not found', async () => {
      const formId: string = new ObjectId().toString();
      await expect(
        service.submissionsExportExcel(formId, 'id-error'),
      ).rejects.toThrow(HttpException);
    });

    it('should return error use does not have permissions to export', async () => {
      const randomNameSuffix = (Math.random() + 1).toString(36).slice(2, 6);
      const userWithoutPermissions: string = new ObjectId().toString();

      const newUserInfo = {
        email: `email.${randomNameSuffix}@test.com`,
        name: `Name ${randomNameSuffix}`,
        lastName: `Lastname ${randomNameSuffix}`,
        password: uuidv4().toString(),
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
        service.submissionsExportExcel(form.id, userWithoutPermissions),
      ).rejects.toThrow(HttpException);

      await service.delete({
        formId: form.id,
        userId: newUser.id,
      });
      await userService.remove({ id: newUser.id, authId: newUser.id });
    });
  });

  it('should return form submissions export excel', async () => {
    const randomNameSuffix = (Math.random() + 1).toString(36).slice(2, 6);

    const newUserInfo = {
      email: `email.${randomNameSuffix}@test.com`,
      name: `Name ${randomNameSuffix}`,
      lastName: `Lastname ${randomNameSuffix}`,
      password: uuidv4().toString(),
      isAdmin: false,
    };

    const newUser = await userService.create(newUserInfo);

    const createFormDto = {
      title: `Test title ${randomNameSuffix}`,
      description: `Test description ${randomNameSuffix}`,
      authorId: newUser.id,
      questions: [
        {
          id: uuidv4().toString(),
          title: 'Question title 1',
          placeholder: 'Question placeholder 1',
          type: 'text',
          isRequired: true,
          options: null,
        },
        {
          id: uuidv4().toString(),
          title: 'Question title 2',
          placeholder: 'Question placeholder 2',
          type: 'select',
          isRequired: true,
          options: [
            { key: 'key1', value: 'value1' },
            { key: 'key2', value: 'value2' },
          ],
        },
      ],
    };

    const form = await service.create(createFormDto);

    const createFormsSubmissionDto: CreateFormsSubmissionDto = {
      formId: form.id,
      answers: [],
    };

    form.questions.forEach((question, index) => {
      if (index === 0) {
        createFormsSubmissionDto.answers.push({
          id: question.id,
          questionId: question.id,
          type: question.type,
          title: question.title,
          value: 'value',
          values: question.options,
        });
      } else {
        createFormsSubmissionDto.answers.push({
          id: question.id,
          questionId: question.id,
          type: question.type,
          title: question.title,
          value: null,
          values: question.options.map((option) => ({
            key: option.key,
            value: option.value,
          })),
        });
      }
    });

    await formsSubmissionsService.create(createFormsSubmissionDto);

    expect(
      await service.submissionsExportExcel(form.id, newUser.id),
    ).toBeInstanceOf(Workbook);

    await service.delete({
      formId: form.id,
      userId: newUser.id,
    });
    await userService.remove({ id: newUser.id, authId: newUser.id });
  });

  describe('permissionsAdd', () => {
    it('should return error form not found', async () => {
      const formId: string = new ObjectId().toString();
      const randomNameSuffix = (Math.random() + 1).toString(36).slice(2, 6);

      const addPermissionsDto: AddPermissionDto = {
        email: `email.${randomNameSuffix}@test.com`,
        roleId: '',
      };

      await expect(
        service.permissionsAdd(formId, addPermissionsDto, 'error-id'),
      ).rejects.toThrow(HttpException);
    });

    it('should return error user not found', async () => {
      const randomNameSuffix = (Math.random() + 1).toString(36).slice(2, 6);

      const addPermissionsDto: AddPermissionDto = {
        email: `email.${randomNameSuffix}.${randomNameSuffix}@test.com`,
        roleId: '',
      };

      const newUserInfo = {
        email: `email.${randomNameSuffix}@test.com`,
        name: `Name ${randomNameSuffix}`,
        lastName: `Lastname ${randomNameSuffix}`,
        password: uuidv4().toString(),
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
        service.permissionsAdd(form.id, addPermissionsDto, 'error-id'),
      ).rejects.toThrow(HttpException);

      await service.delete({
        formId: form.id,
        userId: newUser.id,
      });
      await userService.remove({ id: newUser.id, authId: newUser.id });
    });

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

      const createFormDto = {
        title: `Test title ${randomNameSuffix}`,
        description: `Test description ${randomNameSuffix}`,
        authorId: newUser.id,
        questions: [],
      };

      const form = await service.create(createFormDto);

      const roleCollaborator = await prisma.role.findFirst({
        where: { type: 'collaborator' },
      });

      const permissionCollaboratorAdd = await service.permissionsAdd(
        form.id,
        {
          email: newUser.email,
          roleId: roleCollaborator.id,
        },
        newUser.id,
      );

      expect(permissionCollaboratorAdd).toEqual(
        expect.objectContaining({
          formId: form.id,
          message: 'User role updated',
          roleId: roleCollaborator.id,
          userId: newUser.id,
        }),
      );

      const roleOwner = await prisma.role.findFirst({
        where: { type: 'owner' },
      });

      const permissionOwnerAdd = await service.permissionsAdd(
        form.id,
        {
          email: newUser.email,
          roleId: roleOwner.id,
        },
        newUser.id,
      );

      expect(permissionOwnerAdd).toEqual(
        expect.objectContaining({
          formId: form.id,
          message: 'User role updated',
          roleId: roleOwner.id,
          userId: newUser.id,
        }),
      );

      const randomNameSuffix2 = (Math.random() + 1).toString(36).slice(2, 6);

      const newUser2Info = {
        email: `email.${randomNameSuffix2}@test.com`,
        name: `Name ${randomNameSuffix2}`,
        lastName: `Lastname ${randomNameSuffix2}`,
        password: uuidv4().toString(),
        isAdmin: false,
      };

      const newUser2 = await userService.create(newUser2Info);

      const permissionCollaborator2Add = await service.permissionsAdd(
        form.id,
        {
          email: newUser2.email,
          roleId: roleCollaborator.id,
        },
        newUser.id,
      );

      expect(permissionCollaborator2Add).toEqual(
        expect.objectContaining({
          formId: form.id,
          message: 'User role created',
          roleId: roleCollaborator.id,
          userId: newUser2.id,
        }),
      );

      await service.delete({
        formId: form.id,
        userId: newUser.id,
      });
      await userService.remove({ id: newUser.id, authId: newUser.id });
      await userService.remove({ id: newUser2.id, authId: newUser2.id });
    });
  });

  describe('permissionsRemove', () => {
    it('should return error form not found', async () => {
      const formId: string = new ObjectId().toString();
      const randomNameSuffix = (Math.random() + 1).toString(36).slice(2, 6);

      const removePermissionsDto: RemovePermissionDto = {
        email: `email.${randomNameSuffix}@test.com`,
      };

      await expect(
        service.permissionsRemove(formId, removePermissionsDto, 'error-id'),
      ).rejects.toThrow(HttpException);
    });

    it('should return error user not found', async () => {
      const randomNameSuffix = (Math.random() + 1).toString(36).slice(2, 6);

      const removePermissionsDto: RemovePermissionDto = {
        email: `email.${randomNameSuffix}.${randomNameSuffix}@test.com`,
      };

      const newUserInfo = {
        email: `email.${randomNameSuffix}@test.com`,
        name: `Name ${randomNameSuffix}`,
        lastName: `Lastname ${randomNameSuffix}`,
        password: uuidv4().toString(),
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
        service.permissionsRemove(form.id, removePermissionsDto, 'error-id'),
      ).rejects.toThrow(HttpException);

      await service.delete({
        formId: form.id,
        userId: newUser.id,
      });
      await userService.remove({ id: newUser.id, authId: newUser.id });
    });

    it('should return error user do not have permissions', async () => {
      const randomNameSuffix = (Math.random() + 1).toString(36).slice(2, 6);

      const newUserInfo = {
        email: `email.${randomNameSuffix}@test.com`,
        name: `Name ${randomNameSuffix}`,
        lastName: `Lastname ${randomNameSuffix}`,
        password: uuidv4().toString(),
        isAdmin: false,
      };

      const newUser = await userService.create(newUserInfo);

      const randomNameSuffix2 = (Math.random() + 1).toString(36).slice(2, 6);

      const newUserInfo2 = {
        email: `email.${randomNameSuffix2}@test.com`,
        name: `Name ${randomNameSuffix2}`,
        lastName: `Lastname ${randomNameSuffix2}`,
        password: uuidv4().toString(),
        isAdmin: false,
      };

      const newUser2 = await userService.create(newUserInfo2);

      const createFormDto = {
        title: `Test title ${randomNameSuffix}`,
        description: `Test description ${randomNameSuffix}`,
        authorId: newUser.id,
        questions: [],
      };

      const form = await service.create(createFormDto);

      const removePermissionsDto: RemovePermissionDto = {
        email: newUser2.email,
      };

      await expect(
        service.permissionsRemove(form.id, removePermissionsDto, newUser2.id),
      ).rejects.toThrow(HttpException);

      await service.delete({
        formId: form.id,
        userId: newUser.id,
      });
      await userService.remove({ id: newUser.id, authId: newUser.id });
      await userService.remove({ id: newUser2.id, authId: newUser2.id });
    });

    it('should return error user do not have permissions', async () => {
      const randomNameSuffix = (Math.random() + 1).toString(36).slice(2, 6);

      const newUserInfo = {
        email: `email.${randomNameSuffix}@test.com`,
        name: `Name ${randomNameSuffix}`,
        lastName: `Lastname ${randomNameSuffix}`,
        password: uuidv4().toString(),
        isAdmin: false,
      };

      const newUser = await userService.create(newUserInfo);

      const randomNameSuffix2 = (Math.random() + 1).toString(36).slice(2, 6);

      const newUserInfo2 = {
        email: `email.${randomNameSuffix2}@test.com`,
        name: `Name ${randomNameSuffix2}`,
        lastName: `Lastname ${randomNameSuffix2}`,
        password: uuidv4().toString(),
        isAdmin: false,
      };

      const newUser2 = await userService.create(newUserInfo2);

      const createFormDto = {
        title: `Test title ${randomNameSuffix}`,
        description: `Test description ${randomNameSuffix}`,
        authorId: newUser.id,
        questions: [],
      };

      const form = await service.create(createFormDto);

      const roleCollaborator = await prisma.role.findFirst({
        where: { type: 'collaborator' },
      });

      const permissionCollaboratorAdd = await service.permissionsAdd(
        form.id,
        {
          email: newUser2.email,
          roleId: roleCollaborator.id,
        },
        newUser.id,
      );

      expect(permissionCollaboratorAdd).toEqual(
        expect.objectContaining({
          formId: form.id,
          message: 'User role created',
          roleId: roleCollaborator.id,
          userId: newUser2.id,
        }),
      );

      const removePermissionsDto: RemovePermissionDto = {
        email: newUser2.email,
      };

      await expect(
        service.permissionsRemove(form.id, removePermissionsDto, 'error-id'),
      ).rejects.toThrow(HttpException);

      await service.delete({
        formId: form.id,
        userId: newUser.id,
      });
      await userService.remove({ id: newUser.id, authId: newUser.id });
      await userService.remove({ id: newUser2.id, authId: newUser2.id });
    });

    it('should return ok permission deleted', async () => {
      const randomNameSuffix = (Math.random() + 1).toString(36).slice(2, 6);

      const newUserInfo = {
        email: `email.${randomNameSuffix}@test.com`,
        name: `Name ${randomNameSuffix}`,
        lastName: `Lastname ${randomNameSuffix}`,
        password: uuidv4().toString(),
        isAdmin: false,
      };

      const newUser = await userService.create(newUserInfo);

      const randomNameSuffix2 = (Math.random() + 1).toString(36).slice(2, 6);

      const newUserInfo2 = {
        email: `email.${randomNameSuffix2}@test.com`,
        name: `Name ${randomNameSuffix2}`,
        lastName: `Lastname ${randomNameSuffix2}`,
        password: uuidv4().toString(),
        isAdmin: false,
      };

      const newUser2 = await userService.create(newUserInfo2);

      const createFormDto = {
        title: `Test title ${randomNameSuffix}`,
        description: `Test description ${randomNameSuffix}`,
        authorId: newUser.id,
        questions: [],
      };

      const form = await service.create(createFormDto);

      const roleOwner = await prisma.role.findFirst({
        where: { type: 'owner' },
      });

      const permissionCollaboratorAdd = await service.permissionsAdd(
        form.id,
        {
          email: newUser2.email,
          roleId: roleOwner.id,
        },
        newUser.id,
      );

      expect(permissionCollaboratorAdd).toEqual(
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
        await service.permissionsRemove(
          form.id,
          removePermissionsDto,
          newUser2.id,
        ),
      ).toEqual(expect.objectContaining({ message: 'User role deleted' }));

      await service.delete({
        formId: form.id,
        userId: newUser.id,
      });
      await userService.remove({ id: newUser.id, authId: newUser.id });
      await userService.remove({ id: newUser2.id, authId: newUser2.id });
    });
  });
});
