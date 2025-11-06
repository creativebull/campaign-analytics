import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ExperimentStatus } from '@prisma/client';

export class UpdateExperimentDto {
  @ApiPropertyOptional({
    enum: ExperimentStatus,
    description: 'Experiment status',
  })
  @IsEnum(ExperimentStatus)
  @IsOptional()
  status?: ExperimentStatus;
}
