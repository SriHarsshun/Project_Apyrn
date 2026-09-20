import { Test, TestingModule } from '@nestjs/testing';
import { PrismaAuthRepository } from '../../src/auth/repositories/prisma-auth.repository';
import { PrismaService } from '../../src/common/prisma/prisma.service';

describe('PrismaAuthRepository', () => {
  let repository: PrismaAuthRepository;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn(cb => cb(prisma)),
      company: { create: jest.fn() },
      user: { create: jest.fn(), findUnique: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaAuthRepository, { provide: PrismaService, useValue: prisma }],
    }).compile();

    repository = module.get<PrismaAuthRepository>(PrismaAuthRepository);
  });

  it('createUserWithCompany: creates company and user in transaction', async () => {
    prisma.company.create.mockResolvedValue({ id: 'c1' });
    prisma.user.create.mockResolvedValue({ id: 'u1' });
    const res = await repository.createUserWithCompany({ email: 'e', password: 'p', name: 'n', companyName: 'c' });
    expect(res.id).toBe('u1');
    expect(prisma.company.create).toHaveBeenCalled();
    expect(prisma.user.create).toHaveBeenCalled();
  });

  it('findUserByEmail: finds user', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
    const res = await repository.findUserByEmail('e');
    expect(res?.id).toBe('u1');
  });

  it('findUserById: finds user', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
    const res = await repository.findUserById('1');
    expect(res?.id).toBe('u1');
  });
});
