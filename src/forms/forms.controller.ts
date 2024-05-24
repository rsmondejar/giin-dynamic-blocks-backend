import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  Request,
  Get,
  Param,
  Res,
  Header,
} from '@nestjs/common';
import { FormsService } from './forms.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiSecurity } from '@nestjs/swagger';
import { CreateFormRequestDto } from './dto/create-form-request.dto';
import { Delete } from '@nestjs/common/decorators/http/request-mapping.decorator';
import { Response } from 'express';
import { Workbook } from 'exceljs';
import { AddPermissionDto } from './dto/add-permission.dto';
import { RemovePermissionDto } from './dto/remove-permission.dto';

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

  @UseInterceptors(ClassSerializerInterceptor)
  @Get('find-by-slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    return await this.formsService.findBySlug(slug);
  }

  @UseGuards(JwtAuthGuard)
  @ApiSecurity('access-key')
  @UseInterceptors(ClassSerializerInterceptor)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.formsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiSecurity('access-key')
  @UseInterceptors(ClassSerializerInterceptor)
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    return await this.formsService.delete({
      formId: id,
      userId: req.user.id,
    });
  }

  @UseGuards(JwtAuthGuard)
  @ApiSecurity('access-key')
  @UseInterceptors(ClassSerializerInterceptor)
  @Get(':id/submissions/export/excel')
  @Header('Content-Type', 'text/xlsx')
  async submissionsExportExcel(
    @Param('id') id: string,
    @Res() res: Response,
    @Request() req,
  ) {
    try {
      const workbook: Workbook = await this.formsService.submissionsExportExcel(
        id,
        req.user.id,
      );
      await workbook.xlsx.write(res);
      res.end();
    } catch (error: any) {
      res.status(500).send(error);
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiSecurity('access-key')
  @UseInterceptors(ClassSerializerInterceptor)
  @Post(':id/permissions/add')
  async permissionsAdd(
    @Param('id') id: string,
    @Body() addPermissionsDto: AddPermissionDto,
    @Request() req,
  ) {
    return await this.formsService.permissionsAdd(
      id,
      addPermissionsDto,
      req.user.id,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiSecurity('access-key')
  @UseInterceptors(ClassSerializerInterceptor)
  @Post(':id/permissions/remove')
  async permissionsRemove(
    @Param('id') id: string,
    @Body() removePermissionsDto: RemovePermissionDto,
    @Request() req,
  ) {
    return await this.formsService.permissionsRemove(
      id,
      removePermissionsDto,
      req.user.id,
    );
  }
}
