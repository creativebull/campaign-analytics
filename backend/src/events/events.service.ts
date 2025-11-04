import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, createEventDto: CreateEventDto) {
    const { userId, eventType, properties, timestamp } = createEventDto;

    // Extract experimentId and variant from properties if available
    const experimentId = properties?.experimentId || null;
    const variant = properties?.variant || null;

    // Create event
    const event = await this.prisma.event.create({
      data: {
        tenantId,
        userId,
        eventType,
        properties: properties || {},
        experimentId,
        variant,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
      },
    });

    return event;
  }
}
