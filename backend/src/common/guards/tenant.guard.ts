import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Extract tenant from JWT token (user.tenantId) or API key
    let tenantId: string;

    if (request.user?.tenantId) {
      tenantId = request.user.tenantId;
    } else if (request.headers['x-api-key']) {
      const apiKey = request.headers['x-api-key'];
      const tenant = await this.prisma.tenant.findUnique({
        where: { apiKey },
      });
      if (!tenant) {
        throw new UnauthorizedException('Invalid API key');
      }
      tenantId = tenant.id;
    } else {
      throw new UnauthorizedException('Tenant identification required');
    }

    // Attach tenant to request
    request.tenant = { id: tenantId };
    return true;
  }
}
