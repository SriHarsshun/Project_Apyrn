import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { Prisma } from '@prisma/client';
import { AppException } from '../exceptions/app.exception';
import { getRequestContext } from '../context/request-context';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let message = 'Internal server error';

    if (exception instanceof AppException) {
      statusCode = exception.getStatus();
      errorCode = exception.errorCode;
      message = exception.message;
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      errorCode = 'HTTP_EXCEPTION';
      const res = exception.getResponse();
      message = typeof res === 'string' ? res : (res as any).message || exception.message;
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        statusCode = HttpStatus.CONFLICT;
        errorCode = 'UNIQUE_CONSTRAINT_VIOLATION';
        message = 'A record with this value already exists';
      } else if (exception.code === 'P2025') {
        statusCode = HttpStatus.NOT_FOUND;
        errorCode = 'RECORD_NOT_FOUND';
        message = 'The requested record was not found';
      } else {
        statusCode = HttpStatus.BAD_REQUEST;
        errorCode = 'DATABASE_ERROR';
        message = 'A database error occurred';
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const contextStore = getRequestContext();
    const requestId = contextStore?.requestId || (request as any).id;

    const errorResponse = {
      statusCode,
      errorCode,
      message,
      requestId,
      timestamp: new Date().toISOString(),
      path: (request as any).url,
    };

    response.code(statusCode).send(errorResponse);
  }
}
