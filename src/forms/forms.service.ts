import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateFormDto } from './dto/create-form.dto';
import { PrismaService } from '../../prisma/prisma.service';
import slugify from 'slugify';
import { ObjectId } from 'bson';
import { CreateFormRequestDto } from './dto/create-form-request.dto';
import { QuestionDto } from './dto/question.dto';
import { QuestionOptionDto } from './dto/question-option.dto';
import { User } from '@prisma/client';
import { FormBasicInfo } from './interfaces/form-basic-info.interface';
import { Workbook, Worksheet } from 'exceljs';
import QuestionType from './enums/question-type-enum';
import { AddPermissionDto } from './dto/add-permission.dto';
import { UsersService } from '../users/users.service';
import { RemovePermissionDto } from './dto/remove-permission.dto';

@Injectable()
export class FormsService {
  /**
   * Constructor
   * @param {PrismaService} prisma
   */
  constructor(private prisma: PrismaService) {}

  async findOne(id: string) {
    try {
      if (!this.isValidObjectId(id)) {
        throw new HttpException('Invalid form id', HttpStatus.BAD_REQUEST);
      }

      const form = await this.prisma.form.findFirst({
        where: {
          id: id,
          deletedAt: {
            isSet: false,
          },
        },
      });

      if (!form) {
        throw new HttpException('Form not found', HttpStatus.NOT_FOUND);
      }

      return form;
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status ?? HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async create(createFormDto: CreateFormRequestDto) {
    const questions: QuestionDto[] = createFormDto.questions;
    const authorId = createFormDto.authorId;
    delete createFormDto.authorId;

    const id: string = new ObjectId().toString().slice(0, 8).toLowerCase();
    const data: CreateFormDto = {
      ...createFormDto,
      slug: slugify(`${createFormDto.title} ${id}}`, { lower: true }),
      isPublished: true,
    };

    // Remove options from question with empty values
    data.questions = questions.map((question: QuestionDto): QuestionDto => {
      question.id = new ObjectId().toString();
      delete question.hasError;

      if (question.options === null) {
        delete question.options;
      }

      if (question.options) {
        const options: QuestionOptionDto[] = question.options
          .map(({ key, value, order }): QuestionOptionDto => {
            key = new ObjectId().toString();
            return { key, value, order };
          })
          .filter((option: QuestionOptionDto): boolean => option.value !== '');
        return {
          ...question,
          options: options,
        };
      }
      return question;
    });

    const roleOwner = await this.prisma.role.findFirst({
      where: {
        type: 'owner',
      },
    });

    const formCreated = await this.prisma.form.create({
      data: {
        ...data,
        author: { connect: { id: authorId } },
        formsRoles: {
          create: [
            {
              userId: authorId,
              roleId: roleOwner.id,
            },
          ],
        },
      },
      include: {
        formsRoles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
            user: {
              select: {
                id: true,
                name: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    await this.prisma.audit.create({
      data: {
        action: 'create',
        entity: 'form',
        entityId: formCreated.id,
        userId: authorId,
        detail: formCreated,
      },
    });

    return formCreated;
  }

  async findAllByUser(user: User) {
    // If user is admin, get all forms.
    if (user.isAdmin) {
      return this.prisma.form.findMany({
        orderBy: [{ createdAt: 'desc' }],
        include: {
          _count: {
            select: {
              formSubmission: true,
            },
          },
        },
      });
    }

    // Get only forms where user has permissions.
    return this.prisma.form.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        isPublished: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            name: true,
            lastName: true,
          },
        },
        formsRoles: {
          select: {
            role: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
            user: {
              select: {
                id: true,
                name: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            formSubmission: true,
            formsRoles: true,
          },
        },
      },
      where: {
        deletedAt: {
          isSet: false,
        },
        formsRoles: {
          some: {
            userId: user.id,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  async findBySlug(slug: string): Promise<FormBasicInfo> {
    const form: FormBasicInfo = await this.prisma.form.findUnique({
      where: {
        slug: slug,
        isPublished: true,
        deletedAt: {
          isSet: false,
        },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        isPublished: true,
        questions: true,
      },
    });

    if (!form) {
      throw new HttpException('Form not found', HttpStatus.NOT_FOUND);
    }

    return form;
  }

  async delete({ formId, userId }) {
    try {
      if (!this.isValidObjectId(formId)) {
        throw new HttpException('Invalid form id', HttpStatus.BAD_REQUEST);
      }

      const formExits: FormBasicInfo = await this.findOne(formId);

      if (!formExits) {
        throw new HttpException(
          'Form not found does not have permissions',
          HttpStatus.NOT_FOUND,
        );
      }

      // Check if user has permissions to delete form.
      if (!(await this.checkIfUserHasPermissionsToDeleteForm(formId, userId))) {
        throw new HttpException(
          'User does not have permissions to delete form',
          HttpStatus.FORBIDDEN,
        );
      }

      const formDeleted = await this.prisma.form.update({
        where: {
          id: formId,
        },
        data: {
          updatedAt: new Date(),
          deletedAt: new Date(),
        },
        select: {
          id: true,
          deletedAt: true,
        },
      });

      await this.prisma.audit.create({
        data: {
          action: 'delete',
          entity: 'form',
          entityId: formDeleted.id,
          userId: userId,
          detail: formDeleted,
        },
      });

      return formDeleted;
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status ?? HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async checkIfUserHasPermissionsToDeleteForm(
    formId: string,
    userId: string,
  ): Promise<boolean> {
    const formRoles = await this.prisma.formUserRoles.findFirst({
      where: {
        formId: formId,
        userId: userId,
        role: {
          type: 'owner',
        },
      },
    });
    return !!formRoles;
  }

  async submissionsExportExcel(id: string, authId: string) {
    try {
      if (!this.isValidObjectId(id)) {
        throw new HttpException('Invalid form id', HttpStatus.BAD_REQUEST);
      }

      const form = await this.prisma.form.findFirst({
        where: {
          id: id,
          deletedAt: {
            isSet: false,
          },
        },
      });

      if (!form) {
        throw new HttpException('Form not found', HttpStatus.NOT_FOUND);
      }

      // Check if user has permissions to export form submissions
      const userRole = await this.prisma.formUserRoles.findFirst({
        where: {
          userId: authId,
          formId: id,
        },
      });

      if (!userRole) {
        throw new HttpException(
          'User does not have permissions to export form submissions',
          HttpStatus.FORBIDDEN,
        );
      }

      // Get form submissions
      const formSubmissions = await this.prisma.formSubmission.findMany({
        where: {
          formId: id,
        },
      });

      await this.prisma.audit.create({
        data: {
          action: 'export',
          entity: 'formSubmissionExcelExport',
          entityId: id,
          userId: authId,
          detail: formSubmissions,
        },
      });

      const workbook: Workbook = new Workbook();
      const worksheet: Worksheet = workbook.addWorksheet('form_submissions');

      // Set Excel columns
      worksheet.columns = form.questions.map((question) => {
        return {
          header: question.title,
          key: question.id,
        };
      });

      formSubmissions.forEach((submission) => {
        const row = {};
        submission.answers.forEach((answer) => {
          if (
            [QuestionType.InputSelect, QuestionType.InputRadio].includes(
              answer.type as QuestionType,
            ) &&
            answer.values.length > 0
          ) {
            row[answer.questionId] = answer.values[0]?.value ?? '';
          } else if (answer.type === QuestionType.InputCheckbox) {
            row[answer.questionId] = answer.values
              .map((value) => value.value)
              .join(', ');
          } else {
            row[answer.questionId] = answer.value;
          }
        });
        worksheet.addRow(row);
      });

      return workbook;
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status ?? HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async permissionsAdd(
    id: string,
    addPermissionsDto: AddPermissionDto,
    authId: string,
  ) {
    try {
      // Check if form exists
      await this.findOne(id);

      // Check if user exists
      const user = await new UsersService(this.prisma).findByEmail(
        addPermissionsDto.email,
      );

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      // Check if user has any role in this form
      const userRole = await this.prisma.formUserRoles.findFirst({
        where: {
          userId: user.id,
          formId: id,
        },
      });

      if (userRole) {
        // Update user role
        const formUserRoleUpdate = await this.prisma.formUserRoles.update({
          where: {
            id: userRole.id,
          },
          data: {
            roleId: addPermissionsDto.roleId,
          },
        });

        await this.prisma.audit.create({
          data: {
            action: 'update',
            entity: 'formUserRole',
            entityId: formUserRoleUpdate.id,
            userId: authId,
            detail: {
              message: 'User role updated',
              ...formUserRoleUpdate,
            },
          },
        });

        return {
          message: 'User role updated',
          ...formUserRoleUpdate,
        };
      } else {
        // Create user role
        const formUserRoleCreated = await this.prisma.formUserRoles.create({
          data: {
            userId: user.id,
            formId: id,
            roleId: addPermissionsDto.roleId,
          },
        });

        await this.prisma.audit.create({
          data: {
            action: 'create',
            entity: 'formUserRole',
            entityId: formUserRoleCreated.id,
            userId: authId,
            detail: {
              message: 'User role created',
              ...formUserRoleCreated,
            },
          },
        });

        return {
          message: 'User role created',
          ...formUserRoleCreated,
        };
      }
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status ?? HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async permissionsRemove(
    id: string,
    removePermissionsDto: RemovePermissionDto,
    authId: string,
  ) {
    try {
      // Check if form exists
      await this.findOne(id);

      // Check if user exists
      const user = await new UsersService(this.prisma).findByEmail(
        removePermissionsDto.email,
      );

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      // // Check if user has any role in this form
      const userRole = await this.prisma.formUserRoles.findFirst({
        where: {
          userId: user.id,
          formId: id,
        },
      });

      if (!userRole) {
        throw new HttpException(
          'User does not have permission in this form',
          HttpStatus.FORBIDDEN,
        );
      }

      const formUserRoleRemove = await this.prisma.formUserRoles.delete({
        where: {
          id: userRole.id,
        },
      });

      await this.prisma.audit.create({
        data: {
          action: 'delete',
          entity: 'formUserRole',
          entityId: formUserRoleRemove.id,
          userId: authId,
          detail: {
            message: 'User role deleted',
            ...formUserRoleRemove,
          },
        },
      });

      return {
        message: 'User role deleted',
        ...formUserRoleRemove,
      };
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status ?? HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  isValidObjectId(id: string): boolean {
    return id.length === 24 && ObjectId.isValid(id);
  }
}
