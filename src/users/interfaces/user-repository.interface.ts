import { Prisma } from '@prisma/client';

type User = Prisma.UserGetPayload<{}>;
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

export interface IUserRepository {
  findById(id: string, companyId: string): Promise<User | null>;
  findAll(companyId: string): Promise<User[]>;
  create(data: CreateUserDto & { passwordHash: string }, companyId: string): Promise<User>;
  update(id: string, data: UpdateUserDto, companyId: string): Promise<User>;
  delete(id: string, companyId: string): Promise<User>;
}
