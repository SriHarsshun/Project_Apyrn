import { Test, TestingModule } from '@nestjs/testing';
import { ItemsService } from '../../src/items/items.service';
import { NotFoundException } from '@nestjs/common';
import {
  createMockItem,
  createMockCreateItemDto,
  createMockAdjustItemDto,
} from '../factories/item.factory';
import { RedisService } from '../../src/common/redis/redis.service';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { Queue } from 'bullmq';
import { getQueueToken } from '@nestjs/bullmq';

describe('ItemsService', () => {
  let service: ItemsService;
  let itemRepository: any;
  let redisService: any;
  let prismaService: any;
  let queue: any;
  let redisClient: any;

  beforeEach(async () => {
    itemRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      adjustQuantity: jest.fn(),
      getInventorySummary: jest.fn(),
    };
    
    redisClient = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };
    
    redisService = {
      getClient: jest.fn().mockReturnValue(redisClient),
    };
    
    prismaService = {
      auditLog: {
        create: jest.fn(),
      }
    };
    
    queue = {
      add: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItemsService,
        { provide: 'ITEM_REPOSITORY', useValue: itemRepository },
        { provide: RedisService, useValue: redisService },
        { provide: PrismaService, useValue: prismaService },
        { provide: getQueueToken('low-stock-alerts'), useValue: queue },
      ],
    }).compile();

    service = module.get<ItemsService>(ItemsService);
  });

  it('create: creates item, invalidates cache', async () => {
    const item = createMockItem();
    itemRepository.create.mockResolvedValue(item);
    const dto = createMockCreateItemDto();
    
    const result = await service.create(dto, 'company-id', 'user-id');
    
    expect(result.id).toEqual(item.id);
    expect(redisClient.del).toHaveBeenCalledWith('inventory-summary:company-id');
    expect(prismaService.auditLog.create).toHaveBeenCalled();
  });

  it('findById: returns item', async () => {
    const item = createMockItem();
    itemRepository.findById.mockResolvedValue(item);
    
    const result = await service.findById(item.id, 'company-id');
    
    expect(result.id).toEqual(item.id);
  });

  it('findById: throws NotFoundException', async () => {
    itemRepository.findById.mockResolvedValue(null);
    await expect(service.findById('id', 'company-id')).rejects.toThrow(NotFoundException);
  });

  it('findMany: returns paginated results', async () => {
    const items = [createMockItem()];
    itemRepository.findMany.mockResolvedValue({ items, total: 1, nextCursor: null, hasMore: false });
    
    const result = await service.findMany({ limit: 10 }, 'company-id');
    
    expect(result.items.length).toBe(1);
    expect(result.items[0].id).toBe(items[0].id);
  });

  it('update: updates item, invalidates cache', async () => {
    const item = createMockItem();
    itemRepository.findById.mockResolvedValue(item);
    itemRepository.update.mockResolvedValue(item);
    
    const result = await service.update(item.id, { title: 'New' } as any, 'company-id', 'user-id');
    
    expect(result.id).toEqual(item.id);
    expect(redisClient.del).toHaveBeenCalledWith('inventory-summary:company-id');
  });

  it('softDelete: soft deletes item, invalidates cache', async () => {
    const item = createMockItem();
    itemRepository.findById.mockResolvedValue(item);
    itemRepository.softDelete.mockResolvedValue(item);
    
    await service.softDelete(item.id, 'company-id', 'user-id');
    
    expect(redisClient.del).toHaveBeenCalledWith('inventory-summary:company-id');
  });

  it('adjustQuantity: adjusts quantity atomically, invalidates cache', async () => {
    const item = createMockItem({ quantity: 150 });
    itemRepository.adjustQuantity.mockResolvedValue({ item, auditLog: {} });
    const dto = createMockAdjustItemDto();
    
    const result = await service.adjustQuantity(item.id, dto, 'company-id', 'user-id');
    
    expect(result.id).toEqual(item.id);
    expect(redisClient.del).toHaveBeenCalledWith('inventory-summary:company-id');
  });

  it('adjustQuantity: enqueues low-stock alert when below threshold', async () => {
    const item = createMockItem({ quantity: 5, status: 'LOW_STOCK' });
    itemRepository.adjustQuantity.mockResolvedValue({ item, auditLog: {} });
    const dto = createMockAdjustItemDto();
    
    await service.adjustQuantity(item.id, dto, 'company-id', 'user-id');
    
    expect(queue.add).toHaveBeenCalledWith('low-stock-alert', expect.any(Object), expect.any(Object));
  });

  it('getInventorySummary: returns cached data on cache hit', async () => {
    const summary = { inStock: 10 };
    redisClient.get.mockResolvedValue(JSON.stringify(summary));
    
    const result = await service.getInventorySummary('company-id');
    
    expect(result).toEqual(summary);
    expect(itemRepository.getInventorySummary).not.toHaveBeenCalled();
  });

  it('getInventorySummary: queries DB and caches on cache miss', async () => {
    const summary = { inStock: 10 };
    redisClient.get.mockResolvedValue(null);
    itemRepository.getInventorySummary.mockResolvedValue(summary);
    
    const result = await service.getInventorySummary('company-id');
    
    expect(result).toEqual(summary);
    expect(redisClient.set).toHaveBeenCalled();
  });
});
