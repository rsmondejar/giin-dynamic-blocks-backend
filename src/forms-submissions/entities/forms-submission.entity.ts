import { QuestionAnswerDto } from '../dto/question-answer.dto';

export class FormsSubmission {
  id?: string | null;
  formId?: string | null;
  answers: QuestionAnswerDto[];
}
