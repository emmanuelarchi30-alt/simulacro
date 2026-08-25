import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ example: 'uuid-del-producto', format: 'uuid' })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 1, minimum: 1, maximum: 10, default: 1 })
  @IsInt()
  @Min(1)
  @Max(10)
  quantity: number;
}
