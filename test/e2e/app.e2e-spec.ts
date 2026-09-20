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
import { TransformInterceptor } from '../../src/common/interceptors/transform.interceptor';

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
      .useValue({ getClient: () => ({ get: jest.fn(), set: jest.fn(), del: jest.fn(), ping: jest.fn().mockResolvedValue('PONG') }) })
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

  it('/api/v1/health (GET)', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/health').expect(200);
    console.log('HEALTH RESPONSE:', JSON.stringify(res.body, null, 2));
  });

  it('/api/v1/health/ready (GET)', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/health/ready').expect(200);
    console.log('HEALTH READY RESPONSE:', JSON.stringify(res.body, null, 2));
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
    // Create an extra item to test pagination and filters
    await request(app.getHttpServer())
      .post('/api/v1/items')
      .set('Authorization', `Bearer ${token}`)
      .send({
        sku: `E2E-2-${Date.now()}`,
        title: 'Another E2E Item',
        description: 'Test',
        quantity: 5,
        category: 'Electronics'
      });

    const res = await request(app.getHttpServer())
      .get('/api/v1/items?limit=1&category=Electronics&sortBy=quantity&sortOrder=desc')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    console.log('ADVANCED QUERY RESPONSE:', JSON.stringify(res.body, null, 2));
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

  it('RBAC: VIEWER gets 403 on POST /v1/items', async () => {
    // Register another company to get an admin token
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        companyName: 'Viewer Corp',
        email: `viewer-admin-${Date.now()}@example.com`,
        password: 'password123',
        name: 'Admin',
      });
    const adminToken = res.body.data.accessToken;

    // Create a viewer user
    const viewerRes = await request(app.getHttpServer())
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: `viewer-${Date.now()}@example.com`,
        password: 'password123',
        name: 'Viewer',
        role: 'VIEWER'
      });
    
    // Login as viewer
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: viewerRes.body.data.email,
        password: 'password123'
      });
    const viewerToken = loginRes.body.data.accessToken;

    // Try to mutate items
    await request(app.getHttpServer())
      .post('/api/v1/items')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ sku: `V-${Date.now()}`, title: 'V Item', quantity: 1 })
      .expect(403);
  });

  it('RBAC: MANAGER gets 403 on user-management endpoints', async () => {
    // Register another company to get an admin token
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        companyName: 'Manager Corp',
        email: `manager-admin-${Date.now()}@example.com`,
        password: 'password123',
        name: 'Admin',
      });
    const adminToken = res.body.data.accessToken;

    // Create a manager user (using admin token)
    const managerRes = await request(app.getHttpServer())
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: `manager-${Date.now()}@example.com`,
        password: 'password123',
        name: 'Manager',
        role: 'MANAGER'
      });
    
    // Login as manager
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: managerRes.body.data.email,
        password: 'password123'
      });
    const managerToken = loginRes.body.data.accessToken;

    // Try to create a user
    const errRes = await request(app.getHttpServer())
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        email: `test-${Date.now()}@example.com`,
        password: 'password123',
        name: 'Test',
        role: 'VIEWER'
      })
      .expect(403);
    
    console.log('ERROR RESPONSE FORMAT:', JSON.stringify(errRes.body, null, 2));
  });
});
