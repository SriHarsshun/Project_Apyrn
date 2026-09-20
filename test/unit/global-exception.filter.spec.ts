import { GlobalExceptionFilter } from '../../src/common/filters/global-exception.filter';
import { HttpException, HttpStatus } from '@nestjs/common';
import { AppException } from '../../src/common/exceptions/app.exception';
import { Prisma } from '@prisma/client';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockResponse: any;
  let mockRequest: any;
  let mockHost: any;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
    mockResponse = {
      code: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    mockRequest = {
      url: '/test',
      method: 'GET',
    };
    mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    };
  });

  it('Handles HttpException correctly', () => {
    const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    filter.catch(exception, mockHost);
    expect(mockResponse.code).toHaveBeenCalledWith(403);
    expect(mockResponse.send).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 403,
        message: 'Forbidden',
      }),
    );
  });

  it('Handles AppException with errorCode', () => {
    const exception = new AppException({ message: 'Custom error', statusCode: 400, errorCode: 'CUSTOM_ERR' });
    filter.catch(exception, mockHost);
    expect(mockResponse.code).toHaveBeenCalledWith(400);
    expect(mockResponse.send).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        errorCode: 'CUSTOM_ERR',
      }),
    );
  });

  it('Handles Prisma P2002 (unique constraint) as 409 Conflict', () => {
    const exception = new Prisma.PrismaClientKnownRequestError('msg', {
      code: 'P2002',
      clientVersion: '5',
    });
    filter.catch(exception, mockHost);
    expect(mockResponse.code).toHaveBeenCalledWith(409);
  });

  it('Handles Prisma P2025 (not found) as 404 Not Found', () => {
    const exception = new Prisma.PrismaClientKnownRequestError('msg', {
      code: 'P2025',
      clientVersion: '5',
    });
    filter.catch(exception, mockHost);
    expect(mockResponse.code).toHaveBeenCalledWith(404);
  });

  it('Handles unknown errors as 500 Internal Server Error', () => {
    const exception = new Error('Random error');
    filter.catch(exception, mockHost);
    expect(mockResponse.code).toHaveBeenCalledWith(500);
    expect(mockResponse.send).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
      }),
    );
  });
});
