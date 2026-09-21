import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ItemStatus, Item } from '@prisma/client';

export class ItemResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional()
  description!: string | null;

  @ApiProperty()
  sku!: string;

  @ApiProperty()
  quantity!: number;

  @ApiPropertyOptional()
  category!: string | null;

  @ApiProperty()
  reorderPoint!: number;

  @ApiProperty({ enum: ItemStatus })
  status!: ItemStatus;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  static fromEntity(item: Item): ItemResponseDto {
    return {
      id: item.id,
      title: item.title,
      description: item.description,
      sku: item.sku,
      quantity: item.quantity,
      category: item.category,
      reorderPoint: item.reorderPoint,
      status: item.status,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
