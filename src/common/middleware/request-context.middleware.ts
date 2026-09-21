import { Injectable, NestMiddleware } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { requestContext } from '../context/request-context';
import { randomUUID } from 'crypto';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: FastifyRequest, res: FastifyReply, next: () => void) {
    const requestId = (req.headers['x-request-id'] as string) || randomUUID();

    // Attach to request object for easy access if needed
    (req as any).id = requestId;

    requestContext.run({ requestId }, () => {
      next();
    });
  }
}
