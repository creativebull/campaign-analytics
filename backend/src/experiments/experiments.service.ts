import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExperimentDto } from './dto/create-experiment.dto';

@Injectable()
export class ExperimentsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, createExperimentDto: CreateExperimentDto) {
    const { name, description, variants, status, startDate, endDate } =
      createExperimentDto;

    return this.prisma.experiment.create({
      data: {
        tenantId,
        name,
        description,
        variants: variants,
        status: status || 'DRAFT',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.experiment.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const experiment = await this.prisma.experiment.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: { events: true, userAssignments: true },
        },
      },
    });

    if (!experiment) {
      throw new NotFoundException(`Experiment with ID ${id} not found`);
    }

    return experiment;
  }
}
