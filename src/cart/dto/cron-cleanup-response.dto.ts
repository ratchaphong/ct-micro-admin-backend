// src/cart/dto/cron-cleanup-response.dto.ts
import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

@Exclude()
export class CronCleanupResponseDto {
  @Expose()
  @ApiProperty({
    example: 5,
    description: 'จำนวนรายการที่ถูก soft delete แล้ว (เกิน 7 วัน)',
  })
  softDeletedCount: number;

  @Expose()
  @ApiProperty({
    example: 3,
    description: 'จำนวนรายการที่ถูกลบจริงแล้ว (soft delete เกิน 30 วัน)',
  })
  hardDeletedCount: number;

  @Expose()
  @ApiProperty({
    example: 'cronjob',
    description: 'แหล่งที่มาของการลบข้อมูล เช่น manual หรือ cronjob',
  })
  source: 'cronjob' | 'manual';
}
