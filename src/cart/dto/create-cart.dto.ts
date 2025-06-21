import { ApiProperty } from '@nestjs/swagger';

export class CreateCartDto {
  // @ApiProperty({ example: 'user-123', description: 'รหัสผู้ใช้' })
  // userId: string;

  @ApiProperty({ example: 'product-456', description: 'รหัสสินค้า' })
  productId: string;

  @ApiProperty({ example: 2, description: 'จำนวนสินค้าที่เพิ่มลงตะกร้า' })
  quantity: number;
}
