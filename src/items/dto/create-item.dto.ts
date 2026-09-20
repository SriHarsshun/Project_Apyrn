import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateItemDto {
  @ApiProperty({ description: 'Item title', example: 'Laptop' })
  @IsString()
  @MinLength(1)
  title!: string;

  @ApiPropertyOptional({ description: 'Item description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Stock Keeping Unit', example: 'LAP-001' })
  @IsString()
  sku!: string;

  @ApiProperty({ description: 'Initial quantity', example: 100 })
  @IsInt()
  @Min(0)
  quantity!: number;

  @ApiPropertyOptional({ description: 'Item category', example: 'Electronics' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Reorder point (default 10)', example: 15, default: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  reorderPoint?: number;
}
