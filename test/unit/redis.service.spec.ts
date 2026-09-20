import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from '../../src/common/redis/redis.service';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

jest.mock('ioredis');

describe('RedisService', () => {
  let service: RedisService;
  let redisClient: any;

  beforeEach(async () => {
    const pipelineMock = {
      del: jest.fn(),
      exec: jest.fn().mockResolvedValue([]),
    };
    
    // Create a mock stream
    const mockStream = {
      on: jest.fn((event, callback) => {
        if (event === 'data') {
          callback(['key1', 'key2']);
        }
        if (event === 'end') {
          callback();
        }
      })
    };

    redisClient = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      scanStream: jest.fn().mockReturnValue(mockStream),
      pipeline: jest.fn().mockReturnValue(pipelineMock),
      quit: jest.fn(),
    };

    (Redis as unknown as jest.Mock).mockImplementation(() => redisClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('localhost') } },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
  });

  it('get: returns cached value', async () => {
    redisClient.get.mockResolvedValue('value');
    const result = await service.get('key');
    expect(result).toBe('value');
  });

  it('get: returns null on miss', async () => {
    redisClient.get.mockResolvedValue(null);
    const result = await service.get('key');
    expect(result).toBeNull();
  });

  it('set: sets value with TTL', async () => {
    await service.set('key', 'value', 60);
    expect(redisClient.set).toHaveBeenCalledWith('key', 'value', 'EX', 60);
  });

  it('del: deletes key', async () => {
    await service.del('key');
    expect(redisClient.del).toHaveBeenCalledWith('key');
  });

  it('delByPattern: scans and deletes matching keys', async () => {
    await service.delByPattern('pattern*');
    expect(redisClient.scanStream).toHaveBeenCalledWith({ match: 'pattern*', count: 100 });
  });
});
