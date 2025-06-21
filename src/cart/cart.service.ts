import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCartDto } from './dto/create-cart.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class CartService {
  constructor(
    private prisma: PrismaService,
    @Inject('USER_SERVICE') private userClient: ClientProxy,
    @Inject('PRODUCT_SERVICE') private productClient: ClientProxy,
  ) {}

  async create(dto: CreateCartDto & { userId: string }) {
    const user = await firstValueFrom(
      this.userClient.send({ cmd: 'get-user-by-id' }, dto.userId),
    );
    if (!user) {
      throw new NotFoundException('User does not exist');
    }

    const product = await firstValueFrom(
      this.productClient.send({ cmd: 'get-product-by-id' }, dto.productId),
    );
    if (!product) {
      throw new NotFoundException('Product does not exist');
    }

    return this.prisma.cartItem.create({ data: dto });
  }

  async findAll() {
    return this.prisma.cartItem.findMany();
  }

  async findByUserId(userId: string) {
    return this.prisma.cartItem.findMany({
      where: { userId: userId, isDeleted: false },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteOldCartItems(): Promise<number> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const deleted = await this.prisma.cartItem.deleteMany({
      where: {
        createdAt: { lt: sevenDaysAgo },
        isDeleted: false,
      },
    });

    return deleted.count;
  }

  async purgeSoftDeletedItems(): Promise<number> {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const deleted = await this.prisma.cartItem.deleteMany({
      where: {
        isDeleted: true,
        deletedAt: { lt: oneMonthAgo },
      },
    });

    return deleted.count;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const cart = await this.prisma.cartItem.findFirst({
      where: { id, userId, isDeleted: false },
    });

    if (!cart) return false;

    await this.prisma.cartItem.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return true;
  }

  async softDeleteCartItemsByProductId(productId: string) {
    const result = await this.prisma.cartItem.updateMany({
      where: {
        productId,
        isDeleted: false,
      },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
    console.log(
      `[SoftDelete] Updated ${result.count} cart items for product ${productId}`,
    );
    return result.count;
  }

  async softDeleteOlderThan7Days(): Promise<number> {
    const thresholdDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const { count } = await this.prisma.cartItem.updateMany({
      where: {
        createdAt: { lt: thresholdDate },
        isDeleted: false,
      },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
    return count;
  }

  // ลบจริงรายการที่ถูก soft delete มาแล้วเกิน 30 วัน
  async deletePermanentlyOlderThan30Days(): Promise<number> {
    const thresholdDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const { count } = await this.prisma.cartItem.deleteMany({
      where: {
        isDeleted: true,
        deletedAt: { lt: thresholdDate },
      },
    });
    return count;
  }
}
