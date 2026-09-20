import { HttpException, HttpStatus } from '@nestjs/common';

export class AppException extends HttpException {
  public readonly errorCode: string;

  constructor(options: { statusCode: number; errorCode: string; message: string }) {
    super(options.message, options.statusCode);
    this.errorCode = options.errorCode;
  }
}

export class NotFoundException extends AppException {
  constructor(message: string, errorCode: string = 'NOT_FOUND') {
    super({ statusCode: HttpStatus.NOT_FOUND, errorCode, message });
  }
}

export class ConflictException extends AppException {
  constructor(message: string, errorCode: string = 'CONFLICT') {
    super({ statusCode: HttpStatus.CONFLICT, errorCode, message });
  }
}

export class ForbiddenException extends AppException {
  constructor(message: string, errorCode: string = 'FORBIDDEN') {
    super({ statusCode: HttpStatus.FORBIDDEN, errorCode, message });
  }
}

export class UnauthorizedException extends AppException {
  constructor(message: string, errorCode: string = 'UNAUTHORIZED') {
    super({ statusCode: HttpStatus.UNAUTHORIZED, errorCode, message });
  }
}
