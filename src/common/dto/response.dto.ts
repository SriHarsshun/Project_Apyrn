import { ApiProperty } from '@nestjs/swagger';
import { PaginationMeta } from './pagination.dto';

export class ApiResponse<T> {
  @ApiProperty()
  data: T;

  @ApiProperty({ required: false })
  meta?: PaginationMeta;

  @ApiProperty({ required: false })
  errors?: any[];
}

export function successResponse<T>(data: T, meta?: PaginationMeta): ApiResponse<T> {
  return {
    data,
    ...(meta && { meta }),
  };
}

export function errorResponse(errors: any[]): ApiResponse<null> {
  return {
    data: null as any,
    errors,
  };
}
