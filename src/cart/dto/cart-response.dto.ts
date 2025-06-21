import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class CartResponseDto {
  @Expose()
  @ApiProperty({ example: 'cart-001' })
  id: string;

  @Expose()
  @ApiProperty({ example: 'user-123' })
  userId: string;

  @Expose()
  @ApiProperty({ example: 'product-456' })
  productId: string;

  @Expose()
  @ApiProperty({ example: 2 })
  quantity: number;

  @Expose()
  @ApiProperty({ example: '2025-06-19T12:34:56.789Z' })
  createdAt: string;

  @Expose()
  @ApiProperty({
    example: false,
    description: 'สถานะการลบข้อมูลแบบ soft delete',
  })
  isDeleted: boolean;

  @Expose()
  @ApiProperty({
    example: null,
    description: 'วันที่ถูกลบ (เฉพาะเมื่อ isDeleted เป็น true)',
    nullable: true,
  })
  deletedAt: string | null;
}
