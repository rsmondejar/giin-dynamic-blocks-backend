import { Form, Question } from '@prisma/client';

export interface FormBasicInfo extends Partial<Form> {
  id: string;
  title: string;
  slug: string;
  description: string;
  questions: Question[];
}
