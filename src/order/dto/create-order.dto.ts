import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ description: 'CartItem ID ที่จะ checkout' })
  @IsString()
  cartItemId: string;
}
