import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { getRequestContext } from '../context/request-context';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const ctx = getRequestContext();
    const requestId = ctx?.requestId || '-';
    const userId = ctx?.userId || '-';
    const companyId = ctx?.companyId || '-';

    this.logger.log(`[REQ] ${method} ${url} | ReqID: ${requestId} | User: ${userId} | Company: ${companyId}`);

    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        const statusCode = response.statusCode || response.raw?.statusCode;
        const duration = Date.now() - now;
        
        this.logger.log(`[RES] ${method} ${url} ${statusCode} - ${duration}ms | ReqID: ${requestId}`);
      }),
    );
  }
}
