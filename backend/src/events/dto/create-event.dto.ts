import { IsString, IsEnum, IsObject, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventType } from '@prisma/client';

export class CreateEventDto {
  @ApiProperty({ description: 'User ID', example: 'user_123' })
  @IsString()
  userId: string;

  @ApiProperty({ enum: EventType, description: 'Event type' })
  @IsEnum(EventType)
  eventType: EventType;

  @ApiPropertyOptional({
    description: 'Event properties (JSON)',
    example: { experimentId: 'exp_1', variant: 'B', value: 49.99 },
  })
  @IsObject()
  @IsOptional()
  properties?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Event timestamp',
    example: '2025-09-29T10:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  timestamp?: string;
}
