import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { compare, hash } from 'bcrypt';
import { LoginUserDto } from './dto/login-user.dto';
import { UpdatePasswordUserDto } from './dto/update-password-user.dto';
import { User } from '@prisma/client';
import { UserBasicInfo } from './interfaces/user-basic-info.interface';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Injectable()
export class UsersService {
  /**
   * Constructor
   * @param {PrismaService} prisma
   */
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new user
   * @param {CreateUserDto} createUserDto
   * @returns {Promise<UserBasicInfo>}
   */
  async create(createUserDto: CreateUserDto): Promise<UserBasicInfo> {
    // check if the user exists in the db
    const userInDb: User = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (userInDb) {
      throw new HttpException('user_already_exist', HttpStatus.CONFLICT);
    }
    const newUser = await this.prisma.user.create({
      data: {
        ...createUserDto,
        // role: "CLIENT" as const,
        password: await hash(createUserDto.password, 10),
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: p, ...rest }: User = newUser;

    await this.prisma.audit.create({
      data: {
        action: 'create',
        entity: 'User',
        entityId: rest.id,
        userId: rest.id,
        detail: rest,
      },
    });

    return rest;
  }

  /**
   * Find all users
   * @returns {Promise<User[]>}
   */
  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  /**
   * Find one user by id
   * @param {string} id
   * @returns {Promise<UserBasicInfo>}
   */
  async findOne(id: string): Promise<UserBasicInfo> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: id,
      },
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: p, ...rest } = user;
    return rest;
  }

  /**
   * Remove a user by id
   * @param {string} id
   * @returns {Promise<UserBasicInfo>}
   */
  async remove(id: string): Promise<UserBasicInfo> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: id,
      },
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return this.prisma.user.delete({
      where: {
        id: id,
      },
    });
  }

  /**
   * Find user by login.
   * Use by auth module to login user.
   * @param {string} email
   * @param {string} password
   */
  async findByLogin({ email, password }: LoginUserDto): Promise<UserBasicInfo> {
    const user: User = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new HttpException('USER_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    // compare passwords
    const areEqual = await compare(password, user.password);

    if (!areEqual) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: p, ...rest } = user;
    return rest;
  }

  async findByEmail(email: string): Promise<User> {
    return this.prisma.user.findUnique({
      where: {
        email: email,
      },
    });
  }

  /**
   * Find user by payload.
   * Use by auth module to get user in database
   * @param {string} email
   */
  async findByPayload({ email }: JwtPayload): Promise<User> {
    return await this.findByEmail(email);
  }

  /**
   * Update user password
   * Use by user module to change user password
   * @param payload
   * @param id
   */
  async updatePassword(
    payload: UpdatePasswordUserDto,
    id: string,
  ): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new HttpException('invalid_credentials', HttpStatus.UNAUTHORIZED);
    }
    // compare passwords
    const areEqual = await compare(payload.old_password, user.password);
    if (!areEqual) {
      throw new HttpException('invalid_credentials', HttpStatus.UNAUTHORIZED);
    }
    return this.prisma.user.update({
      where: { id },
      data: { password: await hash(payload.new_password, 10) },
    });
  }
}
