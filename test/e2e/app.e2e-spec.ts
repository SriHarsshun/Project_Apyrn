import { Test, TestingModule } from '@nestjs/testing';
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';
import { AppModule } from '../../src/app.module';
import request from 'supertest';
import { RedisService } from '../../src/common/redis/redis.service';
import { getQueueToken } from '@nestjs/bullmq';
import { LowStockProcessor } from '../../src/items/processors/low-stock.processor';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { GlobalExceptionFilter } from '../../src/common/filters/global-exception.filter';
import { LoggingInterceptor } from '../../src/common/interceptors/logging.interceptor';

describe('AppController (e2e)', () => {
  let app: NestFastifyApplication;
  let token: string;
  let itemId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(LowStockProcessor)
      .useValue({ process: jest.fn() })
      .overrideProvider(RedisService)
      .useValue({ getClient: () => ({ get: jest.fn(), set: jest.fn(), del: jest.fn() }) })
      .overrideProvider(getQueueToken('low-stock-alerts'))
      .useValue({ add: jest.fn() })
      .compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    
    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalInterceptors(new LoggingInterceptor());

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/v1/health (GET)', () => {
    return request(app.getHttpServer()).get('/api/v1/health').expect(200);
  });

  it('/api/v1/auth/register (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        companyName: 'E2E Corp',
        email: `e2e-${Date.now()}@example.com`,
        password: 'password123',
        name: 'E2E Admin',
      })
      .expect(201);

    expect(res.body.data.accessToken).toBeDefined();
    token = res.body.data.accessToken;
  });

  it('/api/v1/items (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/items')
      .set('Authorization', `Bearer ${token}`)
      .send({
        sku: `E2E-${Date.now()}`,
        title: 'E2E Item',
        description: 'Test',
        quantity: 100,
      })
      .expect(201);

    itemId = res.body.data.id;
    expect(itemId).toBeDefined();
  });

  it('/api/v1/items (GET)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/items')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(res.body.data.items)).toBe(true);
  });

  it('/api/v1/items/:id/adjust (POST)', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/items/${itemId}/adjust`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        adjustmentType: 'SUBTRACTION',
        quantity: 10,
        reason: 'Sold',
      })
      .expect(201);
  });
});
