import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiSecurity,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Tenant } from '../common/decorators/tenant.decorator';

@ApiTags('Events')
@Controller('events')
@UseGuards(TenantGuard)
@ApiBearerAuth()
@ApiSecurity('api-key')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute per tenant
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Ingest campaign event' })
  @ApiResponse({ status: 201, description: 'Event created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid event data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Tenant() tenant: any, @Body() createEventDto: CreateEventDto) {
    return this.eventsService.create(tenant.id, createEventDto);
  }
}
