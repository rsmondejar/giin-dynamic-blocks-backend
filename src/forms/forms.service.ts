import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateFormDto } from './dto/create-form.dto';
import { PrismaService } from '../../prisma/prisma.service';
import slugify from 'slugify';
import { ObjectId } from 'bson';
import { CreateFormRequestDto } from './dto/create-form-request.dto';
import { QuestionDto } from './dto/question.dto';
import { QuestionOptionDto } from './dto/question-option.dto';
import { User } from '@prisma/client';
import { FormBasicInfo } from './interfaces/form-basic-info-interface';

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

    return this.prisma.form.create({
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
          every: {
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
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
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

      return await this.prisma.form.update({
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

  isValidObjectId(id: string): boolean {
    return id.length === 24 && ObjectId.isValid(id);
  }
}
