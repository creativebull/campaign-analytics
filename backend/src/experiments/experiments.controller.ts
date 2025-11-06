import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { ExperimentsService } from './experiments.service';
import { CreateExperimentDto } from './dto/create-experiment.dto';
import { UpdateExperimentDto } from './dto/update-experiment.dto';
import { TenantGuard } from '../common/guards/tenant.guard';
import { Tenant } from '../common/decorators/tenant.decorator';

@ApiTags('Experiments')
@Controller('experiments')
@UseGuards(TenantGuard)
@ApiSecurity('api-key')
export class ExperimentsController {
  constructor(private readonly experimentsService: ExperimentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create A/B test configuration' })
  @ApiResponse({ status: 201, description: 'Experiment created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid experiment data' })
  async create(@Tenant() tenant: any, @Body() createExperimentDto: CreateExperimentDto) {
    return this.experimentsService.create(tenant.id, createExperimentDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all experiments for tenant' })
  @ApiResponse({
    status: 200,
    description: 'Experiments retrieved successfully',
  })
  async findAll(@Tenant() tenant: any) {
    return this.experimentsService.findAll(tenant.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get experiment details' })
  @ApiResponse({
    status: 200,
    description: 'Experiment retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Experiment not found' })
  async findOne(@Tenant() tenant: any, @Param('id') id: string) {
    return this.experimentsService.findOne(tenant.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update experiment' })
  @ApiResponse({
    status: 200,
    description: 'Experiment updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Experiment not found' })
  async update(
    @Tenant() tenant: any,
    @Param('id') id: string,
    @Body() updateExperimentDto: UpdateExperimentDto,
  ) {
    return this.experimentsService.update(tenant.id, id, updateExperimentDto);
  }
}
