import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { RedisHealthIndicator } from './indicators/redis-health.indicator';
import { RedisModule } from '../common/redis/redis.module';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [TerminusModule, RedisModule, PrismaModule],
  controllers: [HealthController],
  providers: [RedisHealthIndicator],
})
export class HealthModule {}
