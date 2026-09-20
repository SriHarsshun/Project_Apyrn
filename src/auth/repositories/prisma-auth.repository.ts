import { Injectable } from '@nestjs/common';
import { User, Company, Role } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { IAuthRepository, RegisterData } from '../interfaces/auth-repository.interface';

@Injectable()
export class PrismaAuthRepository implements IAuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createUserWithCompany(data: RegisterData): Promise<User & { company: Company }> {
    return this.prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: data.companyName,
        },
      });

      const user = await tx.user.create({
        data: {
          email: data.email,
          password: data.password,
          name: data.name,
          role: Role.ADMIN,
          companyId: company.id,
        },
        include: {
          company: true,
        },
      });

      return user;
    });
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findUserById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }
}
