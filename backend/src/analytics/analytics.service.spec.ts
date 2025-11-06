import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { EventType } from '@prisma/client';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    event: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSummary', () => {
    const tenantId = 'tenant-123';

    it('should calculate total events and unique users correctly', async () => {
      const mockEvents = [
        {
          id: '1',
          tenantId,
          userId: 'user-1',
          eventType: EventType.PAGE_VIEW,
          experimentId: 'exp-1',
          variant: 'A',
          properties: {},
          timestamp: new Date(),
          createdAt: new Date(),
        },
        {
          id: '2',
          tenantId,
          userId: 'user-1',
          eventType: EventType.CLICK,
          experimentId: 'exp-1',
          variant: 'A',
          properties: {},
          timestamp: new Date(),
          createdAt: new Date(),
        },
        {
          id: '3',
          tenantId,
          userId: 'user-2',
          eventType: EventType.CONVERSION,
          experimentId: 'exp-1',
          variant: 'B',
          properties: {},
          timestamp: new Date(),
          createdAt: new Date(),
        },
      ];

      mockPrismaService.event.findMany.mockResolvedValue(mockEvents);

      const query: AnalyticsQueryDto = {
        experimentId: 'exp-1',
      };

      const result = await service.getSummary(tenantId, query);

      expect(result.totalEvents).toBe(3);
      expect(result.uniqueUsers).toBe(2);
      expect(mockPrismaService.event.findMany).toHaveBeenCalledWith({
        where: {
          tenantId,
          experimentId: 'exp-1',
        },
      });
    });

    it('should calculate variant metrics correctly', async () => {
      const mockEvents = [
        {
          id: '1',
          tenantId,
          userId: 'user-1',
          eventType: EventType.PAGE_VIEW,
          experimentId: 'exp-1',
          variant: 'A',
          properties: {},
          timestamp: new Date(),
          createdAt: new Date(),
        },
        {
          id: '2',
          tenantId,
          userId: 'user-1',
          eventType: EventType.CONVERSION,
          experimentId: 'exp-1',
          variant: 'A',
          properties: {},
          timestamp: new Date(),
          createdAt: new Date(),
        },
        {
          id: '3',
          tenantId,
          userId: 'user-2',
          eventType: EventType.CONVERSION,
          experimentId: 'exp-1',
          variant: 'B',
          properties: {},
          timestamp: new Date(),
          createdAt: new Date(),
        },
        {
          id: '4',
          tenantId,
          userId: 'user-3',
          eventType: EventType.PAGE_VIEW,
          experimentId: 'exp-1',
          variant: 'B',
          properties: {},
          timestamp: new Date(),
          createdAt: new Date(),
        },
      ];

      mockPrismaService.event.findMany.mockResolvedValue(mockEvents);

      const query: AnalyticsQueryDto = {
        experimentId: 'exp-1',
      };

      const result = await service.getSummary(tenantId, query);

      expect(result.variants).toHaveProperty('A');
      expect(result.variants).toHaveProperty('B');

      // Variant A: 2 events, 1 user, 1 conversion
      expect(result.variants.A.events).toBe(2);
      expect(result.variants.A.users).toBe(1);
      expect(result.variants.A.conversions).toBe(1);
      expect(result.variants.A.conversionRate).toBe(1); // 1 conversion / 1 user

      // Variant B: 2 events, 2 users, 1 conversion
      expect(result.variants.B.events).toBe(2);
      expect(result.variants.B.users).toBe(2);
      expect(result.variants.B.conversions).toBe(1);
      expect(result.variants.B.conversionRate).toBe(0.5); // 1 conversion / 2 users
    });

    it('should handle empty events array', async () => {
      mockPrismaService.event.findMany.mockResolvedValue([]);

      const query: AnalyticsQueryDto = {};

      const result = await service.getSummary(tenantId, query);

      expect(result.totalEvents).toBe(0);
      expect(result.uniqueUsers).toBe(0);
      expect(result.variants).toEqual({});
    });

    it('should filter by date range correctly', async () => {
      const startDate = '2025-01-01';
      const endDate = '2025-01-31';

      const mockEvents = [
        {
          id: '1',
          tenantId,
          userId: 'user-1',
          eventType: EventType.PAGE_VIEW,
          experimentId: 'exp-1',
          variant: 'A',
          properties: {},
          timestamp: new Date('2025-01-15'),
          createdAt: new Date(),
        },
      ];

      mockPrismaService.event.findMany.mockResolvedValue(mockEvents);

      const query: AnalyticsQueryDto = {
        startDate,
        endDate,
      };

      await service.getSummary(tenantId, query);

      expect(mockPrismaService.event.findMany).toHaveBeenCalledWith({
        where: {
          tenantId,
          timestamp: {
            gte: new Date(startDate),
            lte: new Date('2025-01-31T23:59:59.999Z'),
          },
        },
      });
    });

    it('should calculate conversion rate as 0 when no users', async () => {
      const mockEvents = [
        {
          id: '1',
          tenantId,
          userId: 'user-1',
          eventType: EventType.PAGE_VIEW,
          experimentId: 'exp-1',
          variant: 'A',
          properties: {},
          timestamp: new Date(),
          createdAt: new Date(),
        },
      ];

      mockPrismaService.event.findMany.mockResolvedValue(mockEvents);

      const query: AnalyticsQueryDto = {
        experimentId: 'exp-1',
      };

      const result = await service.getSummary(tenantId, query);

      // Should still calculate metrics even with no conversions
      expect(result.variants.A.conversionRate).toBe(0);
      expect(result.variants.A.users).toBe(1);
      expect(result.variants.A.conversions).toBe(0);
    });

    it('should handle events without variants', async () => {
      const mockEvents = [
        {
          id: '1',
          tenantId,
          userId: 'user-1',
          eventType: EventType.PAGE_VIEW,
          experimentId: null,
          variant: null,
          properties: {},
          timestamp: new Date(),
          createdAt: new Date(),
        },
        {
          id: '2',
          tenantId,
          userId: 'user-2',
          eventType: EventType.PAGE_VIEW,
          experimentId: 'exp-1',
          variant: 'A',
          properties: {},
          timestamp: new Date(),
          createdAt: new Date(),
        },
      ];

      mockPrismaService.event.findMany.mockResolvedValue(mockEvents);

      const query: AnalyticsQueryDto = {};

      const result = await service.getSummary(tenantId, query);

      // Should only include events with variant and experimentId
      expect(result.variants).toHaveProperty('A');
      expect(result.variants.A.events).toBe(1);
      expect(result.totalEvents).toBe(2); // Total includes all events
      expect(result.uniqueUsers).toBe(2);
    });

    it('should handle multiple conversions for same user', async () => {
      const mockEvents = [
        {
          id: '1',
          tenantId,
          userId: 'user-1',
          eventType: EventType.CONVERSION,
          experimentId: 'exp-1',
          variant: 'A',
          properties: {},
          timestamp: new Date(),
          createdAt: new Date(),
        },
        {
          id: '2',
          tenantId,
          userId: 'user-1',
          eventType: EventType.CONVERSION,
          experimentId: 'exp-1',
          variant: 'A',
          properties: {},
          timestamp: new Date(),
          createdAt: new Date(),
        },
      ];

      mockPrismaService.event.findMany.mockResolvedValue(mockEvents);

      const query: AnalyticsQueryDto = {
        experimentId: 'exp-1',
      };

      const result = await service.getSummary(tenantId, query);

      expect(result.variants.A.events).toBe(2);
      expect(result.variants.A.users).toBe(1); // Same user
      expect(result.variants.A.conversions).toBe(2); // Both are conversions
      expect(result.variants.A.conversionRate).toBe(2); // 2 conversions / 1 user
    });
  });
});
