import { Test, TestingModule } from '@nestjs/testing';
import { PrismaItemRepository } from '../../src/items/repositories/prisma-item.repository';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { createMockItem } from '../factories/item.factory';
import { AdjustmentType } from '@prisma/client';

describe('PrismaItemRepository', () => {
  let repository: PrismaItemRepository;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      item: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        groupBy: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
        aggregate: jest.fn().mockResolvedValue({ _sum: { quantity: 0 } }),
      },
      $transaction: jest.fn(async (cb) => {
        return await cb(prisma);
      }),
      auditLog: {
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaItemRepository, { provide: PrismaService, useValue: prisma }],
    }).compile();

    repository = module.get<PrismaItemRepository>(PrismaItemRepository);
  });

  it('create: creates item with companyId', async () => {
    const item = createMockItem();
    prisma.item.create.mockResolvedValue(item);
    
    const dto = { sku: '1', quantity: 10, reorderPoint: 5 } as any;
    const result = await repository.create(dto, 'company-id');
    
    expect(result).toEqual(item);
    expect(prisma.item.create).toHaveBeenCalled();
  });

  it('findById: finds item with companyId and deletedAt: null', async () => {
    const item = createMockItem();
    prisma.item.findUnique.mockResolvedValue(item);
    
    const result = await repository.findById('id', 'company-id');
    
    expect(result).toEqual(item);
    expect(prisma.item.findUnique).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'id', companyId: 'company-id' },
    }));
  });

  it('findMany: applies filters, pagination, sorting correctly', async () => {
    const items = [createMockItem()];
    prisma.item.findMany.mockResolvedValue(items);
    
    const result = await repository.findMany({ limit: 10, search: 'test' }, 'company-id');
    
    expect(result.items).toEqual(items);
    expect(prisma.item.findMany).toHaveBeenCalled();
  });

  it('softDelete: sets deletedAt instead of deleting', async () => {
    const item = createMockItem();
    prisma.item.findUnique.mockResolvedValue(item);
    prisma.item.delete.mockResolvedValue(item);
    
    await repository.softDelete('id', 'company-id');
    
    expect(prisma.item.delete).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'id', companyId: 'company-id' },
    }));
  });

  it('adjustQuantity: wraps in transaction, updates quantity, creates audit log', async () => {
    const item = createMockItem({ quantity: 10 });
    prisma.item.findFirst.mockResolvedValue(item);
    prisma.item.update.mockResolvedValue({ ...item, quantity: 20 });
    
    const result = await repository.adjustQuantity('id', 'company-id', {
      adjustmentType: AdjustmentType.ADDITION,
      quantity: 10,
      reason: 'test',
    }, 'user-id');
    
    expect(result.item.quantity).toBe(20);
    expect(prisma.item.update).toHaveBeenCalled();
    expect(prisma.auditLog.create).toHaveBeenCalled();
  });

  it('adjustQuantity: prevents negative quantity on subtraction', async () => {
    const item = createMockItem({ quantity: 5 });
    prisma.item.findFirst.mockResolvedValue(item);
    
    await expect(
      repository.adjustQuantity('id', 'company-id', {
        adjustmentType: AdjustmentType.SUBTRACTION,
        quantity: 10,
        reason: 'test',
      }, 'user-id'),
    ).rejects.toThrow();
  });

  it('getInventorySummary: returns correct counts by status', async () => {
    prisma.item.groupBy.mockResolvedValue([
      { status: 'IN_STOCK', _count: 5 },
      { status: 'LOW_STOCK', _count: 2 },
    ]);
    
    const result = await repository.getInventorySummary('company-id');
    
    expect(result.inStock).toEqual(5);
    expect(result.lowStock).toEqual(2);
    expect(result.outOfStock).toEqual(0);
  });
});
