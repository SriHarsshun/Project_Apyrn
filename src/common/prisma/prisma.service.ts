import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super();

    // Soft delete middleware
    this.$use(async (params, next) => {
      if (params.model === 'Item') {
        if (!params.args) params.args = {};
        if (params.action === 'findUnique' || params.action === 'findFirst') {
          params.action = 'findFirst';
          params.args.where = { ...params.args.where, deletedAt: null };
        }
        if (params.action === 'findMany') {
          if (params.args.where) {
            if (params.args.where.deletedAt === undefined) {
              params.args.where.deletedAt = null;
            }
          } else {
            params.args.where = { deletedAt: null };
          }
        }
        if (params.action === 'update' || params.action === 'updateMany') {
          if (params.args.where) {
            params.args.where.deletedAt = null;
          }
        }
        if (params.action === 'delete') {
          params.action = 'update';
          params.args.data = { deletedAt: new Date() };
        }
        if (params.action === 'deleteMany') {
          params.action = 'updateMany';
          if (params.args.data !== undefined) {
            params.args.data.deletedAt = new Date();
          } else {
            params.args.data = { deletedAt: new Date() };
          }
        }
        if (params.action === 'count') {
          if (params.args.where) {
            if (params.args.where.deletedAt === undefined) {
              params.args.where.deletedAt = null;
            }
          } else {
            params.args.where = { deletedAt: null };
          }
        }
      }
      return next(params);
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
