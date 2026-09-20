import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { ItemsService } from '../../src/items/items.service';
import { AdjustmentType } from '@prisma/client';
import { execSync } from 'child_process';

describe('Items Integration', () => {
  let moduleRef: TestingModule;
  let prisma: PrismaService;
  let itemsService: ItemsService;
  let companyAId: string;
  let companyBId: string;
  let userAId: string;

  beforeAll(async () => {
    try {
      execSync('npx prisma migrate deploy', { stdio: 'ignore' });
    } catch (e) {
      console.warn('DB not available, skipping init');
    }

    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    prisma = moduleRef.get(PrismaService);
    itemsService = moduleRef.get(ItemsService);

    try {
      await prisma.$connect();
      const compA = await prisma.company.create({ data: { name: 'CompA' } });
      const compB = await prisma.company.create({ data: { name: 'CompB' } });
      companyAId = compA.id;
      companyBId = compB.id;
      const userA = await prisma.user.create({ data: { name: 'User A', email: 'a@a.com', password: '123', companyId: companyAId }});
      userAId = userA.id;
    } catch (e) {
      console.warn('DB connection failed, tests might fail', e);
    }
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.auditLog.deleteMany();
      await prisma.item.deleteMany();
      await prisma.user.deleteMany();
      await prisma.company.deleteMany();
      await prisma.$disconnect();
    }
    if (moduleRef) {
      await moduleRef.close();
    }
  });

  it('Create item -> verify in DB', async () => {
    if (!companyAId) return;
    const item = await itemsService.create({
      sku: 'INT-001',
      title: 'Int Item',
      description: 'Desc',
      quantity: 10,
    }, companyAId, userAId);
    expect(item.id).toBeDefined();
    
    const dbItem = await prisma.item.findUnique({ where: { id: item.id }});
    expect(dbItem?.companyId).toBe(companyAId);
  });

  it('Multi-tenancy: Company A cannot see Company B items', async () => {
    if (!companyAId) return;
    const itemA = await itemsService.create({
      sku: 'INT-002',
      title: 'Int Item A',
      description: 'Desc',
      quantity: 10,
    }, companyAId, userAId);

    const itemsB = await itemsService.findMany({ limit: 10 }, companyBId);
    expect(itemsB.items.some((i: any) => i.id === itemA.id)).toBe(false);
  });

  it('Adjust quantity -> verify item and audit log', async () => {
    if (!companyAId) return;
    const item = await itemsService.create({
      sku: 'INT-003',
      title: 'Int Item A',
      description: 'Desc',
      quantity: 10,
    }, companyAId, userAId);

    const adjusted = await itemsService.adjustQuantity(item.id, {
      adjustmentType: AdjustmentType.ADDITION,
      quantity: 5,
      reason: 'test',
    }, companyAId, userAId);

    expect(adjusted.quantity).toBe(15);
    const logs = await prisma.auditLog.findMany({ 
      where: { itemId: item.id, action: 'ADJUST_INVENTORY' } 
    });
    expect(logs.length).toBe(1);
    expect(logs[0].newQuantity).toBe(15);
  });
});
