import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateFormsSubmissionDto } from './dto/create-forms-submission.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { ObjectId } from 'bson';
import { QuestionAnswerDto } from './dto/question-answer.dto';

@Injectable()
export class FormsSubmissionsService {
  /**
   * Constructor
   * @param {PrismaService} prisma
   */
  constructor(private prisma: PrismaService) {}

  async create(createFormsSubmissionDto: CreateFormsSubmissionDto) {
    const formId: string = createFormsSubmissionDto.formId;

    // Check if form exists and it is published
    const form = await this.prisma.form.findUnique({
      where: {
        id: formId,
        isPublished: true,
        deletedAt: {
          isSet: false,
        },
      },
    });

    if (!form) {
      throw new HttpException('Form not found', HttpStatus.NOT_FOUND);
    }

    const answers: QuestionAnswerDto[] = createFormsSubmissionDto.answers;

    answers.map((answer) => {
      answer.id = new ObjectId().toString();
      if (typeof answer.value === 'undefined' || answer.value === null) {
        answer.value = '';
      }
      if (typeof answer.values === 'undefined' || answer.values === null) {
        answer.values = [];
      }
      return answer;
    });

    return this.prisma.formSubmission.create({
      data: {
        answers: answers,
        form: {
          connect: {
            id: formId,
          },
        },
      },
    });
  }
}
