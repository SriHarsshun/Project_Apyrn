import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaUserRepository } from './repositories/prisma-user.repository';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [
    {
      provide: 'USER_REPOSITORY',
      useClass: PrismaUserRepository,
    },
    UsersService,
  ],
  exports: [UsersService],
})
export class UsersModule {}
