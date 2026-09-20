import { User, Company } from '@prisma/client';
import { RegisterDto } from '../dto/register.dto';

export type RegisterData = RegisterDto;

export interface IAuthRepository {
  createUserWithCompany(data: RegisterData): Promise<User & { company: Company }>;
  findUserByEmail(email: string): Promise<User | null>;
  findUserById(id: string): Promise<User | null>;
}
