import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // สมมติคุณมี PrismaService กลาง
import { CreateOrderDto } from './dto/create-order.dto';
import { CartService } from 'src/cart/cart.service';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private cartService: CartService,
    @Inject('PRODUCT_SERVICE') private readonly productClient: ClientProxy,
  ) {}

  async createOrder(userId: string, dto: CreateOrderDto) {
    // 1. หา CartItem ตาม cartItemId
    const cartItem = await this.prisma.cartItem.findUnique({
      where: { id: dto.cartItemId },
    });

    if (!cartItem) {
      throw new NotFoundException('ไม่พบรายการในตะกร้า');
    }

    if (cartItem.isDeleted) {
      throw new NotFoundException('รายการนี้ถูกลบไปแล้ว');
    }

    if (cartItem.userId !== userId) {
      throw new UnauthorizedException('คุณไม่มีสิทธิ์ในรายการนี้');
    }

    // 2. ดึงข้อมูล Product จาก PRODUCT_SERVICE
    const product = await firstValueFrom(
      this.productClient.send({ cmd: 'get-product-by-id' }, cartItem.productId),
    );

    if (!product) {
      throw new NotFoundException('ไม่พบสินค้า');
    }

    // 3. คำนวณราคาทั้งหมด
    const totalPrice = cartItem.quantity * product.price;
    console.log(totalPrice);

    // 4. Soft delete CartItem
    await this.cartService.delete(dto.cartItemId, userId);

    // 5. สร้าง Order
    return this.prisma.order.create({
      data: {
        userId: userId,
        productId: cartItem.productId,
        totalPrice: totalPrice,
        status: 'COMPLETED',
      },
    });
  }

  async findAll(skip: number, take: number) {
    return this.prisma.order.findMany({
      skip,
      take,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findMine(userId: string) {
    return this.prisma.order.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
