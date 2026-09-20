import { Prisma } from '@prisma/client';

type Item = Prisma.ItemGetPayload<{}>;
type AuditLog = Prisma.AuditLogGetPayload<{}>;
import { CreateItemDto } from '../dto/create-item.dto';
import { UpdateItemDto } from '../dto/update-item.dto';
import { AdjustItemDto } from '../dto/adjust-item.dto';
import { QueryItemDto } from '../dto/query-item.dto';
import { InventorySummaryDto } from '../dto/inventory-summary.dto';

export interface IItemRepository {
  create(data: CreateItemDto, companyId: string): Promise<Item>;
  findById(id: string, companyId: string): Promise<Item | null>;
  findMany(query: QueryItemDto, companyId: string): Promise<{ items: Item[]; total: number; nextCursor: string | null; hasMore: boolean }>;
  update(id: string, data: UpdateItemDto, companyId: string): Promise<Item>;
  softDelete(id: string, companyId: string): Promise<Item>;
  adjustQuantity(id: string, companyId: string, adjustment: AdjustItemDto, userId: string): Promise<{ item: Item; auditLog: AuditLog }>;
  getInventorySummary(companyId: string): Promise<InventorySummaryDto>;
}
