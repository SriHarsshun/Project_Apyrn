import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma, ItemStatus, AdjustmentType } from '@prisma/client';

type Item = Prisma.ItemGetPayload<{}>;
type AuditLog = Prisma.AuditLogGetPayload<{}>;
import { PrismaService } from '../../common/prisma/prisma.service';
import { IItemRepository } from '../interfaces/item-repository.interface';
import { CreateItemDto } from '../dto/create-item.dto';
import { UpdateItemDto } from '../dto/update-item.dto';
import { AdjustItemDto } from '../dto/adjust-item.dto';
import { QueryItemDto } from '../dto/query-item.dto';
import { InventorySummaryDto } from '../dto/inventory-summary.dto';

@Injectable()
export class PrismaItemRepository implements IItemRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getStatus(quantity: number, reorderPoint: number): ItemStatus {
    if (quantity === 0) return ItemStatus.OUT_OF_STOCK;
    if (quantity <= reorderPoint) return ItemStatus.LOW_STOCK;
    return ItemStatus.IN_STOCK;
  }

  async create(data: CreateItemDto, companyId: string): Promise<Item> {
    const reorderPoint = data.reorderPoint ?? 10;
    const status = this.getStatus(data.quantity, reorderPoint);

    return this.prisma.item.create({
      data: {
        ...data,
        reorderPoint,
        status,
        companyId,
      },
    });
  }

  async findById(id: string, companyId: string): Promise<Item | null> {
    return this.prisma.item.findUnique({
      where: { id, companyId },
    });
  }

  async findMany(query: QueryItemDto, companyId: string): Promise<{ items: Item[]; total: number; nextCursor: string | null; hasMore: boolean }> {
    const limit = query.limit || 10;
    
    const where: Prisma.ItemWhereInput = {
      companyId,
    };

    if (query.status) where.status = query.status;
    if (query.category) where.category = query.category;
    
    if (query.minQuantity !== undefined || query.maxQuantity !== undefined) {
      where.quantity = {};
      if (query.minQuantity !== undefined) where.quantity.gte = query.minQuantity;
      if (query.maxQuantity !== undefined) where.quantity.lte = query.maxQuantity;
    }

    if (query.search) {
      where.title = { contains: query.search, mode: 'insensitive' };
    }

    const orderBy: Prisma.ItemOrderByWithRelationInput = {
      [query.sortBy || 'createdAt']: query.sortOrder || 'desc',
    };

    const items = await this.prisma.item.findMany({
      where,
      take: limit + 1,
      cursor: query.cursor ? { id: query.cursor } : undefined,
      orderBy,
    });

    const total = await this.prisma.item.count({ where });

    let nextCursor: string | null = null;
    let hasMore = false;
    
    if (items.length > limit) {
      hasMore = true;
      const nextItem = items.pop();
      nextCursor = nextItem?.id || null;
    }

    return { items, total, nextCursor, hasMore };
  }

  async update(id: string, data: UpdateItemDto, companyId: string): Promise<Item> {
    const { reorderPoint, ...rest } = data;
    
    const existing = await this.prisma.item.findUnique({ where: { id, companyId } });
    if (!existing) throw new NotFoundException('Item not found');

    const newReorderPoint = reorderPoint !== undefined ? reorderPoint : existing.reorderPoint;
    const status = this.getStatus(existing.quantity, newReorderPoint);

    return this.prisma.item.update({
      where: { id, companyId },
      data: {
        ...rest,
        reorderPoint: newReorderPoint,
        status,
      },
    });
  }

  async softDelete(id: string, companyId: string): Promise<Item> {
    return this.prisma.item.delete({
      where: { id, companyId },
    });
  }

  async adjustQuantity(id: string, companyId: string, adjustment: AdjustItemDto, userId: string): Promise<{ item: Item; auditLog: AuditLog }> {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const item = await tx.item.findFirst({
        where: { id, companyId, deletedAt: null },
      });

      if (!item) throw new NotFoundException('Item not found');

      let newQuantity = item.quantity;
      if (adjustment.adjustmentType === AdjustmentType.ADDITION) {
        newQuantity += adjustment.quantity;
      } else if (adjustment.adjustmentType === AdjustmentType.SUBTRACTION) {
        newQuantity -= adjustment.quantity;
        if (newQuantity < 0) throw new BadRequestException('Resulting quantity cannot be negative');
      } else if (adjustment.adjustmentType === AdjustmentType.MANUAL_SET) {
        newQuantity = adjustment.quantity;
      }

      const newStatus = this.getStatus(newQuantity, item.reorderPoint);

      const updatedItem = await tx.item.update({
        where: { id },
        data: {
          quantity: newQuantity,
          status: newStatus,
        },
      });

      const auditLog = await tx.auditLog.create({
        data: {
          action: 'ADJUST_INVENTORY',
          entityId: item.id,
          entityType: 'ITEM',
          itemId: item.id,
          adjustmentType: adjustment.adjustmentType,
          quantityChange: adjustment.adjustmentType === AdjustmentType.SUBTRACTION ? -adjustment.quantity : adjustment.quantity,
          previousQuantity: item.quantity,
          newQuantity,
          reason: adjustment.reason,
          metadata: {
            adjustmentType: adjustment.adjustmentType,
            requestedQuantity: adjustment.quantity,
          },
          userId,
          companyId,
        },
      });

      return { item: updatedItem, auditLog };
    });
  }

  async getInventorySummary(companyId: string): Promise<InventorySummaryDto> {
    const totalCount = await this.prisma.item.count({
      where: { companyId, deletedAt: null },
    });

    const quantityAgg = await this.prisma.item.aggregate({
      where: { companyId, deletedAt: null },
      _sum: { quantity: true },
    });

    const groups = await this.prisma.item.groupBy({
      by: ['status'],
      where: { companyId, deletedAt: null },
      _count: true,
    });

    const summary: InventorySummaryDto = {
      totalItems: totalCount,
      totalQuantity: quantityAgg._sum.quantity || 0,
      inStock: 0,
      lowStock: 0,
      outOfStock: 0,
    };

    groups.forEach((g: any) => {
      if (g.status === ItemStatus.IN_STOCK) summary.inStock = g._count;
      else if (g.status === ItemStatus.LOW_STOCK) summary.lowStock = g._count;
      else if (g.status === ItemStatus.OUT_OF_STOCK) summary.outOfStock = g._count;
    });

    return summary;
  }
}
