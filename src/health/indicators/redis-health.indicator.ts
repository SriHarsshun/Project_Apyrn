import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { RedisService } from '../../common/redis/redis.service';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private readonly redisService: RedisService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const client = this.redisService.getClient();
      await client.ping();
      return this.getStatus(key, true);
    } catch (error: any) {
      throw new HealthCheckError(
        'RedisHealthCheck failed',
        this.getStatus(key, false, { message: error.message }),
      );
    }
  }
}
