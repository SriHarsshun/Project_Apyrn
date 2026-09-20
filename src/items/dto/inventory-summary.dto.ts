import { ApiProperty } from '@nestjs/swagger';

export class InventorySummaryDto {
  @ApiProperty()
  totalItems!: number;

  @ApiProperty()
  inStock!: number;

  @ApiProperty()
  lowStock!: number;

  @ApiProperty()
  outOfStock!: number;

  @ApiProperty()
  totalQuantity!: number;
}
