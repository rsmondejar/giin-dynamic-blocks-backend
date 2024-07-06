import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { UserBasicInfo } from './interfaces/user-basic-info.interface';
import { ConfigModule } from '@nestjs/config';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      providers: [UsersService, PrismaService],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    // it('should return User not found', async () => {
    //   const user = await service.findOne('user-not-found');
    //   expect(user).toBeDefined();
    // });

    // it('should return a user', async () => {
    //   // Create user to test
    //   const newUser: UserBasicInfo = await service.create({
    //     email: 'email.1@test.com',
    //     name: 'Name Test',
    //     lastName: 'Lastname Test',
    //     password: 'password',
    //   });
    //   const user = await service.findOne(newUser.id);
    //   expect(user).toBeDefined();
    // });
  });
});
