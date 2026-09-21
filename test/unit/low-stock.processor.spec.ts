import { Test, TestingModule } from '@nestjs/testing';
import { LowStockProcessor } from '../../src/items/processors/low-stock.processor';
import { Logger } from '@nestjs/common';

describe('LowStockProcessor', () => {
  let processor: LowStockProcessor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LowStockProcessor],
    }).compile();

    processor = module.get<LowStockProcessor>(LowStockProcessor);
  });

  it('should process job and log warning', async () => {
    const loggerSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    const job = {
      data: {
        id: '1',
        title: 'Item',
        sku: 'SKU',
        quantity: 1,
        reorderPoint: 5,
        companyId: 'C1',
      },
    } as any;

    await processor.process(job);
    expect(loggerSpy).toHaveBeenCalled();
  });
});
