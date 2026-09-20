import { Test, TestingModule } from '@nestjs/testing';
import { PrismaUserRepository } from '../../src/users/repositories/prisma-user.repository';
import { PrismaService } from '../../src/common/prisma/prisma.service';

describe('PrismaUserRepository', () => {
  let repository: PrismaUserRepository;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaUserRepository, { provide: PrismaService, useValue: prisma }],
    }).compile();

    repository = module.get<PrismaUserRepository>(PrismaUserRepository);
  });

  it('findById', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: 'u1' });
    const res = await repository.findById('u1', 'c1');
    expect(res?.id).toBe('u1');
  });

  it('findAll', async () => {
    prisma.user.findMany.mockResolvedValue([{ id: 'u1' }]);
    const res = await repository.findAll('c1');
    expect(res[0].id).toBe('u1');
  });

  it('create', async () => {
    prisma.user.create.mockResolvedValue({ id: 'u1' });
    const res = await repository.create({ email: 'e' } as any, 'c1');
    expect(res.id).toBe('u1');
  });

  it('update', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: 'u1' });
    prisma.user.update.mockResolvedValue({ id: 'u1' });
    const res = await repository.update('u1', { name: 'n' } as any, 'c1');
    expect(res.id).toBe('u1');
  });

  it('delete', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: 'u1' });
    prisma.user.delete.mockResolvedValue({ id: 'u1' });
    const res = await repository.delete('u1', 'c1');
    expect(res.id).toBe('u1');
  });
});
