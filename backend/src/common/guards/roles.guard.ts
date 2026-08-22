import {
  Injectable,
  CanActivate,
  ExecutionContext,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.role) {
      // Security principle: Return 404 instead of 403 to prevent role probing/endpoint enumeration
      throw new NotFoundException();
    }

    // Check if user's role matches any of the required roles (case-insensitive mapping)
    const userRole = user.role.toUpperCase();
    const hasRole = requiredRoles.some(
      (role) => role.toUpperCase() === userRole,
    );

    if (!hasRole) {
      throw new NotFoundException();
    }

    return true;
  }
}
