import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { type FandomRole } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { type AuthenticatedRequest } from '../interfaces/auth.interface';

export const FANDOM_ROLES_KEY = 'fandom_roles';

export const FandomRoles = (...roles: FandomRole[]) =>
  SetMetadata(FANDOM_ROLES_KEY, roles);

import { SetMetadata } from '@nestjs/common';

@Injectable()
export class FandomRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<FandomRole[]>(
      FANDOM_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles?.length) {
      return true;
    }

    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = req.user;
    const fandomId =
      (req.params as Record<string, string>).fandomId ??
      (req.body as Record<string, string>).fandom_id;

    if (!fandomId) {
      throw new NotFoundException('Fandom ID is required');
    }

    // admin bypass ทุก fandom
    if (user.role === 'admin') {
      return true;
    }

    const membership = await this.prisma.fandom_members.findUnique({
      where: {
        fandom_id_user_id: {
          fandom_id: fandomId,
          user_id: user.user_id,
        },
      },
    });

    if (!membership || !requiredRoles.includes(membership.role)) {
      throw new ForbiddenException('You do not have the required fandom role');
    }

    return true;
  }
}
