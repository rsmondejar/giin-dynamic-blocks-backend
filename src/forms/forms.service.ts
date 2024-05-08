import { Injectable } from '@nestjs/common';
import { CreateFormDto } from './dto/create-form.dto';
import { PrismaService } from '../../prisma/prisma.service';
import slugify from 'slugify';
import { ObjectId } from 'bson';
import { CreateFormRequestDto } from './dto/create-form-request.dto';
import { QuestionDto } from './dto/question.dto';

@Injectable()
export class FormsService {
  /**
   * Constructor
   * @param {PrismaService} prisma
   */
  constructor(private prisma: PrismaService) {}

  async create(createFormDto: CreateFormRequestDto) {
    const questions: QuestionDto[] = createFormDto.questions;
    const authorId = createFormDto.authorId;
    delete createFormDto.questions;
    delete createFormDto.authorId;

    const id: string = new ObjectId().toString().slice(0, 8).toLowerCase();
    const data: CreateFormDto = {
      ...createFormDto,
      slug: slugify(`${createFormDto.title} ${id}}`, { lower: true }),
      isPublished: false,
    };

    // Remove options from question with empty values
    const questionsOptionsCleaned: any = questions.map((question) => {
      const questionType: string = question.type;
      delete question.type;
      delete question.id;

      if (question.options) {
        const options: { key: string; value: string }[] = question.options
          .map(({ key, value }): { key: string; value: string } => {
            return { key, value };
          })
          .filter(
            (option: { key: string; value: string }): boolean =>
              option.value !== '',
          );
        return {
          ...question,
          field: { connect: { type: questionType } },
          options: {
            create: options,
          },
        };
      }
      return {
        ...question,
        field: { connect: { type: questionType } },
      };
    });

    return this.prisma.form.create({
      data: {
        ...data,
        author: { connect: { id: authorId } },
        fieldValues: {
          create: questionsOptionsCleaned,
        },
      },
      include: {
        fieldValues: {
          include: {
            options: true,
          },
        },
      },
    });
  }

  // findAll() {
  //   return `This action returns all forms`;
  // }

  // findOne(id: string) {
  //   return `This action returns a #${id} form`;
  // }

  // remove(id: string) {
  //   return `This action removes a #${id} form`;
  // }
}
