import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Extract tenant from API key
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('API key required in X-API-Key header');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { apiKey },
    });

    if (!tenant) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Attach tenant to request
    request.tenant = { id: tenant.id };
    return true;
  }
}
