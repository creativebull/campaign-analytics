import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { AnalyticsService, AnalyticsSummary } from './analytics.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Tenant } from '../common/decorators/tenant.decorator';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(TenantGuard)
@ApiSecurity('api-key')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get aggregated analytics metrics' })
  @ApiResponse({
    status: 200,
    description: 'Analytics summary retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSummary(
    @Tenant() tenant: any,
    @Query() query: AnalyticsQueryDto,
  ): Promise<AnalyticsSummary> {
    return this.analyticsService.getSummary(tenant.id, query);
  }
}
