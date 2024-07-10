import { ObjectId } from 'bson';
import { CreateFormDto } from './create-form.dto';
import slugify from 'slugify';
import { CreateFormRequestDto } from './create-form-request.dto';

describe('CreateFormDto', () => {
  it('should return error invalid form id', async () => {
    const createFormDto: CreateFormRequestDto = {
      title: 'Test Form',
      description: 'Test Form Description',
      questions: [],
    };
    const id: string = new ObjectId().toString().slice(0, 8).toLowerCase();
    const data: CreateFormDto = {
      ...createFormDto,
      slug: slugify(`${createFormDto.title} ${id}}`, { lower: true }),
      isPublished: true,
    };

    expect(data).toEqual(
      expect.objectContaining({
        title: 'Test Form',
        description: 'Test Form Description',
        slug: slugify(`${createFormDto.title} ${id}}`, { lower: true }),
        isPublished: true,
      }),
    );
  });
});
