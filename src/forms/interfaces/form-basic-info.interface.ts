import { Form, Question } from '@prisma/client';

export interface FormBasicInfo extends Partial<Form> {
  id: string;
  title: string;
  slug: string;
  isPublished: boolean;
  description: string;
  questions: Question[];
}
