import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';

interface VariantMetrics {
  events: number;
  users: number;
  conversions: number;
  conversionRate: number;
}

interface AnalyticsSummary {
  totalEvents: number;
  uniqueUsers: number;
  variants: Record<string, VariantMetrics>;
}

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getSummary(
    tenantId: string,
    query: AnalyticsQueryDto,
  ): Promise<AnalyticsSummary> {
    const { startDate, endDate, experimentId } = query;

    // Build date filter
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.timestamp = {};
      if (startDate) {
        dateFilter.timestamp.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.timestamp.lte = end;
      }
    }

    // Build where clause
    const where: any = {
      tenantId,
      ...dateFilter,
    };

    if (experimentId) {
      where.experimentId = experimentId;
    }

    // Get all events in the time range
    const events = await this.prisma.event.findMany({
      where,
    });

    // Calculate total events and unique users
    const totalEvents = events.length;
    const uniqueUsers = new Set(events.map((e) => e.userId)).size;

    // Calculate metrics by variant
    const variants: Record<string, VariantMetrics> = {};
    const variantEvents = experimentId
      ? events.filter((e) => e.variant)
      : events.filter((e) => e.variant && e.experimentId);

    variantEvents.forEach((event) => {
      const variant = event.variant!;
      if (!variants[variant]) {
        variants[variant] = {
          events: 0,
          users: new Set<string>(),
          conversions: 0,
          conversionRate: 0,
        } as any;
      }

      variants[variant].events++;
      (variants[variant].users as any).add(event.userId);

      if (event.eventType === 'CONVERSION') {
        variants[variant].conversions++;
      }
    });

    // Convert Set to number and calculate conversion rates
    Object.keys(variants).forEach((variant) => {
      const variantData = variants[variant] as any;
      variantData.users = variantData.users.size;
      variantData.conversionRate =
        variantData.users > 0
          ? variantData.conversions / variantData.users
          : 0;
    });

    const result: AnalyticsSummary = {
      totalEvents,
      uniqueUsers,
      variants: variants as Record<string, VariantMetrics>,
    };

    return result;
  }
}
