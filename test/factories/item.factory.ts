import { ItemStatus, AdjustmentType } from '@prisma/client';
import * as crypto from 'crypto';

export function createMockItem(overrides?: any) {
  return {
    id: crypto.randomUUID(),
    companyId: crypto.randomUUID(),
    sku: 'SKU-001',
    title: 'Test Item',
    description: 'Test Description',
    quantity: 100,
    status: ItemStatus.IN_STOCK,
    category: 'Test Category',
    reorderPoint: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

export function createMockCreateItemDto(overrides?: any) {
  return {
    sku: 'SKU-001',
    title: 'Test Item',
    description: 'Test Description',
    quantity: 100,
    category: 'Test Category',
    reorderPoint: 10,
    ...overrides,
  };
}

export function createMockAdjustItemDto(overrides?: any) {
  return {
    adjustmentType: AdjustmentType.ADDITION,
    quantity: 50,
    reason: 'Restock',
    ...overrides,
  };
}

export function createMockAuditLog(overrides?: any) {
  return {
    id: crypto.randomUUID(),
    action: 'ADJUST_INVENTORY',
    entityType: 'ITEM',
    entityId: crypto.randomUUID(),
    adjustmentType: AdjustmentType.ADDITION,
    quantityChange: 50,
    previousQuantity: 100,
    newQuantity: 150,
    reason: 'Restock',
    metadata: {},
    userId: crypto.randomUUID(),
    companyId: crypto.randomUUID(),
    itemId: crypto.randomUUID(),
    createdAt: new Date(),
    ...overrides,
  };
}
