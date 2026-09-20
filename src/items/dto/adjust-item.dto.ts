import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsString, Min, MinLength, ValidateIf } from 'class-validator';
import { AdjustmentType } from '@prisma/client';

export class AdjustItemDto {
  @ApiProperty({ enum: AdjustmentType, description: 'Type of adjustment' })
  @IsEnum(AdjustmentType)
  adjustmentType!: AdjustmentType;

  @ApiProperty({ description: 'Quantity to adjust' })
  @IsInt()
  @ValidateIf((o) => o.adjustmentType === AdjustmentType.MANUAL_SET)
  @Min(0)
  @ValidateIf((o) => o.adjustmentType !== AdjustmentType.MANUAL_SET)
  @Min(1)
  quantity!: number;

  @ApiProperty({ description: 'Reason for adjustment' })
  @IsString()
  @MinLength(1)
  reason!: string;
}
