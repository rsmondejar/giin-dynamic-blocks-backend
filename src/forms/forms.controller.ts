import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor, Request, Get,
} from '@nestjs/common';
import { FormsService } from './forms.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiSecurity } from '@nestjs/swagger';
import { CreateFormRequestDto } from './dto/create-form-request.dto';

@Controller('forms')
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @UseGuards(JwtAuthGuard)
  @ApiSecurity('access-key')
  @UseInterceptors(ClassSerializerInterceptor)
  @Post()
  async create(@Body() createFormDto: CreateFormRequestDto, @Request() req) {
    return await this.formsService.create({
      ...createFormDto,
      authorId: req.user.id,
    });
  }

  @UseGuards(JwtAuthGuard)
  @ApiSecurity('access-key')
  @UseInterceptors(ClassSerializerInterceptor)
  @Get('find-all-by-user')
  async findAll(@Request() req) {
    return await this.formsService.findAllByUser(req.user);
  }

  // @Get()
  // findAll() {
  //   return this.formsService.findAll();
  // }

  // @Get(':id')
  // async findOne(@Param('id') id: string) {
  //   return await this.formsService.findOne(id);
  // }

  // @Delete(':id')
  // async remove(@Param('id') id: string) {
  //   return await this.formsService.remove(id);
  // }
}
