import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

@Processor('low-stock-alerts')
export class LowStockProcessor extends WorkerHost {
  private readonly logger = new Logger(LowStockProcessor.name);

  async process(job: Job<any, any, string>): Promise<void> {
    const { id, title, sku, quantity, reorderPoint, companyId } = job.data;
    this.logger.warn({
      msg: 'Low stock alert',
      itemId: id,
      title,
      sku,
      quantity,
      reorderPoint,
      companyId,
    });
  }
}
