import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ItemsService } from './items.service';
import { ItemsController } from './items.controller';
import { PrismaItemRepository } from './repositories/prisma-item.repository';
import { LowStockProcessor } from './processors/low-stock.processor';
import { PrismaModule } from '../common/prisma/prisma.module';
import { RedisModule } from '../common/redis/redis.module';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    BullModule.registerQueue({
      name: 'low-stock-alerts',
    }),
  ],
  controllers: [ItemsController],
  providers: [
    {
      provide: 'ITEM_REPOSITORY',
      useClass: PrismaItemRepository,
    },
    ItemsService,
    LowStockProcessor,
  ],
  exports: [ItemsService],
})
export class ItemsModule {}
