import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ForbiddenException } from '../exceptions/app.exception';
import { requestContext } from '../context/request-context';

@Injectable()
export class CompanyContextGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.companyId) {
      throw new ForbiddenException('Company context is missing', 'MISSING_COMPANY_CONTEXT');
    }

    request.companyId = user.companyId;

    const store = requestContext.getStore();
    if (store) {
      store.userId = user.id || user.userId;
      store.companyId = user.companyId;
    }

    return true;
  }
}
