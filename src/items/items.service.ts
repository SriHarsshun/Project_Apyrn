import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { IItemRepository } from './interfaces/item-repository.interface';
import { RedisService } from '../common/redis/redis.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { AdjustItemDto } from './dto/adjust-item.dto';
import { QueryItemDto } from './dto/query-item.dto';
import { ItemResponseDto } from './dto/item-response.dto';
import { InventorySummaryDto } from './dto/inventory-summary.dto';
import { ItemStatus } from '@prisma/client';

@Injectable()
export class ItemsService {
  constructor(
    @Inject('ITEM_REPOSITORY') private readonly itemRepository: IItemRepository,
    private readonly redisService: RedisService,
    private readonly prisma: PrismaService,
    @InjectQueue('low-stock-alerts') private readonly lowStockQueue: Queue,
  ) {}

  private async invalidateSummaryCache(companyId: string) {
    const redis = this.redisService.getClient();
    await redis.del(`inventory-summary:${companyId}`);
  }

  private async checkLowStock(item: any, companyId: string) {
    if (item.status === ItemStatus.LOW_STOCK || item.status === ItemStatus.OUT_OF_STOCK) {
      await this.lowStockQueue.add(
        'low-stock-alert',
        {
          id: item.id,
          title: item.title,
          sku: item.sku,
          quantity: item.quantity,
          reorderPoint: item.reorderPoint,
          companyId,
        },
        { removeOnComplete: true },
      );
    }
  }

  async create(dto: CreateItemDto, companyId: string, userId: string): Promise<ItemResponseDto> {
    const item = await this.itemRepository.create(dto, companyId);
    await this.invalidateSummaryCache(companyId);

    await this.prisma.auditLog.create({
      data: {
        action: 'CREATE_ITEM',
        entityId: item.id,
        entityType: 'ITEM',
        itemId: item.id,
        metadata: dto as any,
        userId,
        companyId,
      },
    });

    await this.checkLowStock(item, companyId);
    return ItemResponseDto.fromEntity(item);
  }

  async findById(id: string, companyId: string): Promise<ItemResponseDto> {
    const item = await this.itemRepository.findById(id, companyId);
    if (!item) throw new NotFoundException('Item not found');
    return ItemResponseDto.fromEntity(item);
  }

  async findMany(query: QueryItemDto, companyId: string) {
    const result = await this.itemRepository.findMany(query, companyId);
    return {
      ...result,
      items: result.items.map(ItemResponseDto.fromEntity),
    };
  }

  async update(
    id: string,
    dto: UpdateItemDto,
    companyId: string,
    userId: string,
  ): Promise<ItemResponseDto> {
    const item = await this.itemRepository.update(id, dto, companyId);
    await this.invalidateSummaryCache(companyId);

    await this.prisma.auditLog.create({
      data: {
        action: 'UPDATE_ITEM',
        entityId: item.id,
        entityType: 'ITEM',
        itemId: item.id,
        metadata: dto as any,
        userId,
        companyId,
      },
    });

    await this.checkLowStock(item, companyId);
    return ItemResponseDto.fromEntity(item);
  }

  async softDelete(id: string, companyId: string, userId: string): Promise<ItemResponseDto> {
    const item = await this.itemRepository.softDelete(id, companyId);
    await this.invalidateSummaryCache(companyId);

    await this.prisma.auditLog.create({
      data: {
        action: 'DELETE_ITEM',
        entityId: item.id,
        entityType: 'ITEM',
        itemId: item.id,
        metadata: { softDelete: true },
        userId,
        companyId,
      },
    });

    return ItemResponseDto.fromEntity(item);
  }

  async adjustQuantity(
    id: string,
    dto: AdjustItemDto,
    companyId: string,
    userId: string,
  ): Promise<ItemResponseDto> {
    const { item } = await this.itemRepository.adjustQuantity(id, companyId, dto, userId);
    await this.invalidateSummaryCache(companyId);
    await this.checkLowStock(item, companyId);
    return ItemResponseDto.fromEntity(item);
  }

  async getInventorySummary(companyId: string): Promise<InventorySummaryDto> {
    const cacheKey = `inventory-summary:${companyId}`;
    const redis = this.redisService.getClient();
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const summary = await this.itemRepository.getInventorySummary(companyId);
    await redis.set(cacheKey, JSON.stringify(summary), 'EX', 60);
    return summary;
  }
}
