import {
  IsString,
  IsOptional,
  IsArray,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExperimentStatus } from '@prisma/client';

export class CreateExperimentDto {
  @ApiProperty({
    description: 'Experiment name',
    example: 'Homepage CTA Test',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Experiment description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Variants configuration',
    example: ['A', 'B'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  variants: string[];

  @ApiPropertyOptional({
    enum: ExperimentStatus,
    default: ExperimentStatus.DRAFT,
  })
  @IsEnum(ExperimentStatus)
  @IsOptional()
  status?: ExperimentStatus;

  @ApiPropertyOptional({
    description: 'Start date',
    example: '2025-09-29T00:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date',
    example: '2025-09-30T23:59:59Z',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}
