import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { IUserRepository } from '../interfaces/user-repository.interface';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string, companyId: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { id, companyId },
    });
  }

  async findAll(companyId: string): Promise<User[]> {
    return this.prisma.user.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: CreateUserDto & { passwordHash: string }, companyId: string): Promise<User> {
    return this.prisma.user.create({
      data: {
        email: data.email,
        password: data.passwordHash,
        name: data.name,
        role: data.role,
        companyId,
      },
    });
  }

  async update(id: string, data: UpdateUserDto, companyId: string): Promise<User> {
    const user = await this.findById(id, companyId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        email: data.email,
        name: data.name,
        role: data.role,
      },
    });
  }

  async delete(id: string, companyId: string): Promise<User> {
    const user = await this.findById(id, companyId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.delete({
      where: { id },
    });
  }
}
