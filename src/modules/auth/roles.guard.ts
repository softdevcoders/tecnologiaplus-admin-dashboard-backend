import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { I18nContext } from 'nestjs-i18n';

import { ROLES_KEY } from './roles.decorator';
import { UserRole } from '../users/user.entity';

interface AuthenticatedRequest extends Request {
  user?: { role: UserRole };
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const userRole = request.user?.role;
    const i18n = I18nContext.current(context);
    const translate = (key: string) => (i18n ? i18n.t(key) : key);
    if (!userRole) {
      throw new ForbiddenException(translate('errors.user_not_authenticated'));
    }

    if (requiredRoles.includes(userRole)) return true;
    throw new ForbiddenException(translate('errors.insufficient_role'));
  }
}
