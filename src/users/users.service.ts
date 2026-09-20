import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { IUserRepository } from './interfaces/user-repository.interface';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class UsersService {
  constructor(
    @Inject('USER_REPOSITORY') private readonly userRepository: IUserRepository,
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreateUserDto, companyId: string, currentUserId: string): Promise<UserResponseDto> {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    
    try {
      const user = await this.userRepository.create({ ...dto, passwordHash }, companyId);
      
      await this.prisma.auditLog.create({
        data: {
          action: 'CREATE_USER',
          entityId: user.id,
          entityType: 'USER',
          metadata: { email: user.email, role: user.role },
          userId: currentUserId,
          companyId,
        },
      });

      return UserResponseDto.fromEntity(user);
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Email already in use');
      }
      throw error;
    }
  }

  async findAll(companyId: string): Promise<UserResponseDto[]> {
    const users = await this.userRepository.findAll(companyId);
    return users.map(UserResponseDto.fromEntity);
  }

  async findById(id: string, companyId: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(id, companyId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return UserResponseDto.fromEntity(user);
  }

  async update(id: string, dto: UpdateUserDto, companyId: string, currentUserId: string): Promise<UserResponseDto> {
    const user = await this.userRepository.update(id, dto, companyId);
    
    await this.prisma.auditLog.create({
      data: {
        action: 'UPDATE_USER',
        entityId: user.id,
        entityType: 'USER',
        metadata: dto as any,
        userId: currentUserId,
        companyId,
      },
    });

    return UserResponseDto.fromEntity(user);
  }

  async delete(id: string, companyId: string, currentUserId: string): Promise<UserResponseDto> {
    const user = await this.userRepository.delete(id, companyId);
    
    await this.prisma.auditLog.create({
      data: {
        action: 'DELETE_USER',
        entityId: user.id,
        entityType: 'USER',
        metadata: { email: user.email },
        userId: currentUserId,
        companyId,
      },
    });

    return UserResponseDto.fromEntity(user);
  }
}
