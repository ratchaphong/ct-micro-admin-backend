// src/cart/cart-cron.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CartService } from './cart.service';
import { plainToInstance } from 'class-transformer';
import { CronCleanupResponseDto } from './dto/cron-cleanup-response.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CartCronService {
  private readonly logger = new Logger(CartCronService.name);

  constructor(
    private readonly cartService: CartService,
    private readonly configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCartCleanup(): Promise<CronCleanupResponseDto> {
    const softDeleted = await this.cartService.softDeleteOlderThan7Days();
    const hardDeleted =
      await this.cartService.deletePermanentlyOlderThan30Days();

    this.logger.log(
      `🧹 [CartCronService] Soft-deleted: ${softDeleted}, Hard-deleted: ${hardDeleted}`,
    );

    return plainToInstance(CronCleanupResponseDto, {
      softDeletedCount: softDeleted,
      hardDeletedCount: hardDeleted,
      source: 'cronjob',
    });
  }

  @Cron('*/15 * * * * *')
  handleLogEvery15Seconds() {
    const port = this.configService.get('PORT');
    const queue = this.configService.get('QUEUE_NAME');
    this.logger.log(
      `👋 Hello from CartCronService | PORT: ${port} | QUEUE: ${queue}`,
    );
  }
}
