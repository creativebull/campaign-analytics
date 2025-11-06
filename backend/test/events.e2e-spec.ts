import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { EventType } from '@prisma/client';

describe('Events E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testTenant: { id: string; apiKey: string };
  let testExperimentId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Apply global prefix
    app.setGlobalPrefix('api');

    // Apply validation pipes
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    await app.init();

    // Create test tenant
    testTenant = await prisma.tenant.create({
      data: {
        name: 'Test Tenant E2E',
        apiKey: `test-api-key-e2e-${Date.now()}`,
      },
    });

    // Create test experiment
    const experiment = await prisma.experiment.create({
      data: {
        tenantId: testTenant.id,
        name: 'E2E Test Experiment',
        status: 'ACTIVE',
        variants: [{ name: 'A', trafficSplit: 50 }, { name: 'B', trafficSplit: 50 }],
      },
    });
    testExperimentId = experiment.id;
  });

  afterAll(async () => {
    // Clean up test data
    if (testExperimentId) {
      await prisma.experiment.deleteMany({
        where: { tenantId: testTenant.id },
      });
    }
    await prisma.event.deleteMany({
      where: { tenantId: testTenant.id },
    });
    await prisma.tenant.delete({
      where: { id: testTenant.id },
    });

    await app.close();
  });

  describe('POST /events', () => {
    it('should create a page view event successfully', async () => {
      const eventData = {
        userId: 'user-e2e-1',
        eventType: 'PAGE_VIEW',
        properties: {
          experimentId: testExperimentId,
          variant: 'A',
          page: '/home',
        },
      };

      const response = await request(app.getHttpServer())
        .post('/events')
        .set('X-API-Key', testTenant.apiKey)
        .send(eventData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.userId).toBe(eventData.userId);
      expect(response.body.eventType).toBe('PAGE_VIEW');
      expect(response.body.experimentId).toBe(testExperimentId);
      expect(response.body.variant).toBe('A');
      expect(response.body.tenantId).toBe(testTenant.id);

      // Verify event was saved in database
      const savedEvent = await prisma.event.findUnique({
        where: { id: response.body.id },
      });
      expect(savedEvent).toBeDefined();
      expect(savedEvent?.userId).toBe(eventData.userId);
    });

    it('should create a click event successfully', async () => {
      const eventData = {
        userId: 'user-e2e-2',
        eventType: 'CLICK',
        properties: {
          experimentId: testExperimentId,
          variant: 'B',
          element: 'button',
        },
        timestamp: new Date().toISOString(),
      };

      const response = await request(app.getHttpServer())
        .post('/events')
        .set('X-API-Key', testTenant.apiKey)
        .send(eventData)
        .expect(201);

      expect(response.body.eventType).toBe('CLICK');
      expect(response.body.variant).toBe('B');
    });

    it('should create a conversion event successfully', async () => {
      const eventData = {
        userId: 'user-e2e-3',
        eventType: 'CONVERSION',
        properties: {
          experimentId: testExperimentId,
          variant: 'A',
          value: 49.99,
        },
      };

      const response = await request(app.getHttpServer())
        .post('/events')
        .set('X-API-Key', testTenant.apiKey)
        .send(eventData)
        .expect(201);

      expect(response.body.eventType).toBe('CONVERSION');
      expect(response.body.properties).toMatchObject({
        value: 49.99,
      });
    });

    it('should reject event without API key', async () => {
      const eventData = {
        userId: 'user-e2e-4',
        eventType: 'PAGE_VIEW',
        properties: {},
      };

      await request(app.getHttpServer())
        .post('/events')
        .send(eventData)
        .expect(401);
    });

    it('should reject event with invalid API key', async () => {
      const eventData = {
        userId: 'user-e2e-5',
        eventType: 'PAGE_VIEW',
        properties: {},
      };

      await request(app.getHttpServer())
        .post('/events')
        .set('X-API-Key', 'invalid-api-key')
        .send(eventData)
        .expect(401);
    });

    it('should reject event with invalid eventType', async () => {
      const eventData = {
        userId: 'user-e2e-6',
        eventType: 'INVALID_TYPE',
        properties: {},
      };

      await request(app.getHttpServer())
        .post('/events')
        .set('X-API-Key', testTenant.apiKey)
        .send(eventData)
        .expect(400);
    });

    it('should reject event without userId', async () => {
      const eventData = {
        eventType: 'PAGE_VIEW',
        properties: {},
      };

      await request(app.getHttpServer())
        .post('/events')
        .set('X-API-Key', testTenant.apiKey)
        .send(eventData)
        .expect(400);
    });

    it('should handle event without experimentId in properties', async () => {
      const eventData = {
        userId: 'user-e2e-7',
        eventType: 'PAGE_VIEW',
        properties: {
          page: '/about',
        },
      };

      const response = await request(app.getHttpServer())
        .post('/events')
        .set('X-API-Key', testTenant.apiKey)
        .send(eventData)
        .expect(201);

      expect(response.body.experimentId).toBeNull();
      expect(response.body.variant).toBeNull();
    });

    it('should extract experimentId and variant from properties', async () => {
      const eventData = {
        userId: 'user-e2e-8',
        eventType: 'PAGE_VIEW',
        properties: {
          experimentId: testExperimentId,
          variant: 'B',
          customData: 'test',
        },
      };

      const response = await request(app.getHttpServer())
        .post('/events')
        .set('X-API-Key', testTenant.apiKey)
        .send(eventData)
        .expect(201);

      expect(response.body.experimentId).toBe(testExperimentId);
      expect(response.body.variant).toBe('B');
      expect(response.body.properties).toHaveProperty('customData', 'test');
    });

    it('should use provided timestamp or default to current time', async () => {
      const customTimestamp = new Date('2025-01-15T10:00:00Z').toISOString();
      const eventData = {
        userId: 'user-e2e-9',
        eventType: 'PAGE_VIEW',
        properties: {},
        timestamp: customTimestamp,
      };

      const response = await request(app.getHttpServer())
        .post('/events')
        .set('X-API-Key', testTenant.apiKey)
        .send(eventData)
        .expect(201);

      expect(new Date(response.body.timestamp).toISOString()).toBe(customTimestamp);
    });

    it('should ensure tenant isolation - tenant A cannot see tenant B events', async () => {
      // Create another tenant
      const otherTenant = await prisma.tenant.create({
        data: {
          name: 'Other Test Tenant',
          apiKey: `test-api-key-other-${Date.now()}`,
        },
      });

      // Create event for first tenant
      const event1 = await request(app.getHttpServer())
        .post('/events')
        .set('X-API-Key', testTenant.apiKey)
        .send({
          userId: 'user-tenant1',
          eventType: 'PAGE_VIEW',
          properties: {},
        })
        .expect(201);

      // Create event for second tenant
      const event2 = await request(app.getHttpServer())
        .post('/events')
        .set('X-API-Key', otherTenant.apiKey)
        .send({
          userId: 'user-tenant2',
          eventType: 'PAGE_VIEW',
          properties: {},
        })
        .expect(201);

      // Verify events belong to different tenants
      expect(event1.body.tenantId).toBe(testTenant.id);
      expect(event2.body.tenantId).toBe(otherTenant.id);
      expect(event1.body.tenantId).not.toBe(event2.body.tenantId);

      // Clean up
      await prisma.event.deleteMany({
        where: { tenantId: otherTenant.id },
      });
      await prisma.tenant.delete({
        where: { id: otherTenant.id },
      });
    });
  });
});
