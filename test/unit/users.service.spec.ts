import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../../src/users/users.service';
import { NotFoundException } from '@nestjs/common';
import { createMockUser } from '../factories/user.factory';
import { PrismaService } from '../../src/common/prisma/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: any;

  beforeEach(async () => {
    userRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: 'USER_REPOSITORY', useValue: userRepository },
        { provide: PrismaService, useValue: { auditLog: { create: jest.fn() } } },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('findAll: returns users for company', async () => {
    const users = [createMockUser()];
    userRepository.findAll.mockResolvedValue(users);
    const result = await service.findAll('company-id');
    expect(result).toEqual(users.map(u => expect.objectContaining({ id: u.id })));
  });

  it('findById: returns user', async () => {
    const user = createMockUser();
    userRepository.findById.mockResolvedValue(user);
    const result = await service.findById('company-id', user.id);
    expect(result).toEqual(expect.objectContaining({ id: user.id }));
  });

  it('findById: throws NotFoundException when not found', async () => {
    userRepository.findById.mockResolvedValue(null);
    await expect(service.findById('company-id', 'id')).rejects.toThrow(NotFoundException);
  });

  it('create: creates user', async () => {
    const user = createMockUser();
    userRepository.create.mockResolvedValue(user);
    const result = await service.create(user as any, 'company-id', 'current-user-id');
    expect(result).toEqual(expect.objectContaining({ id: user.id }));
  });

  it('update: updates user', async () => {
    const user = createMockUser();
    userRepository.findById.mockResolvedValue(user);
    userRepository.update.mockResolvedValue(user);
    const result = await service.update(user.id, { name: 'New Name' }, 'company-id', 'current-user-id');
    expect(result).toEqual(expect.objectContaining({ id: user.id }));
  });

  it('delete: deletes user', async () => {
    const user = createMockUser();
    userRepository.findById.mockResolvedValue(user);
    userRepository.delete.mockResolvedValue(user);
    await service.delete(user.id, 'company-id', 'current-user-id');
    expect(userRepository.delete).toHaveBeenCalledWith(user.id, 'company-id');
  });
});
