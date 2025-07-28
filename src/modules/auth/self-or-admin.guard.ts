import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { UserRole } from '../users/user.entity';
import { I18nContext } from 'nestjs-i18n';

interface AuthenticatedRequest extends Request {
  user?: { userId: string; role: UserRole };
}

@Injectable()
export class SelfOrAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const i18n = I18nContext.current(context);
    const translate = (key: string) => (i18n ? i18n.t(key) : key);

    const { userId, role } = request.user ?? {};
    const targetId = request.params?.id;

    if (!role) {
      throw new ForbiddenException(translate('errors.user_not_authenticated'));
    }

    if (role === UserRole.ADMIN) return true;

    if (targetId && userId === targetId) return true;

    throw new ForbiddenException(translate('errors.own_record_only'));
  }
}
