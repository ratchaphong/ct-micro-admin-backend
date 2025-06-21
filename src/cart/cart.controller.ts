import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBearerAuth,
  ApiParam,
  ApiNoContentResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { CartService } from './cart.service';
import { CreateCartDto } from './dto/create-cart.dto';
import { CartResponseDto } from './dto/cart-response.dto'; // <— คุณอาจต้องสร้างไฟล์นี้
import { JwtAuthGuard } from './jwt-auth.guard';
import { plainToInstance } from 'class-transformer';
import { MessagePattern } from '@nestjs/microservices';
import { CronCleanupResponseDto } from './dto/cron-cleanup-response.dto';

@ApiTags('Cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @MessagePattern({ cmd: 'soft-delete-cart-by-product-id' })
  async handleSoftDeleteCartItems(productId: string) {
    return this.cartService.softDeleteCartItemsByProductId(productId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'เพิ่มสินค้าเข้าตะกร้า' })
  @ApiBody({ type: CreateCartDto })
  @ApiCreatedResponse({
    description: 'สร้างรายการในตะกร้าเรียบร้อยแล้ว',
    type: CartResponseDto,
  })
  async create(@Body() dto: CreateCartDto, @Req() req: any) {
    const userId = req.user.id;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    console.log(userId);
    const cart = await this.cartService.create({ ...dto, userId });
    return plainToInstance(CartResponseDto, cart);
  }

  @Get()
  @ApiOperation({ summary: 'ดึงรายการตะกร้าทั้งหมด' })
  @ApiOkResponse({
    description: 'รายการตะกร้าทั้งหมด',
    type: CartResponseDto,
    isArray: true,
  })
  async findAll() {
    const carts = await this.cartService.findAll();
    return carts.map((item) => plainToInstance(CartResponseDto, item));
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('my')
  @ApiOperation({ summary: 'ดึงตะกร้าของผู้ใช้งานที่เข้าสู่ระบบ' })
  @ApiOkResponse({
    description: 'รายการตะกร้าของผู้ใช้งาน',
    type: CartResponseDto,
    isArray: true,
  })
  async findMine(@Req() req: any) {
    const userId = req.user.id;
    const carts = await this.cartService.findByUserId(userId);
    return carts.map((item) => plainToInstance(CartResponseDto, item));
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'ลบรายการตะกร้าตาม ID' })
  @ApiParam({ name: 'id', description: 'Cart ID', example: 'cart-001' })
  @ApiNoContentResponse({ description: 'ลบรายการสำเร็จแล้ว' })
  @ApiNotFoundResponse({ description: 'ไม่พบรายการที่ต้องการลบ' })
  async deleteCart(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.id;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    const deleted = await this.cartService.delete(id, userId);
    if (!deleted) {
      throw new UnauthorizedException('ไม่พบหรือไม่สามารถลบรายการนี้ได้');
    }
    return; // HTTP 204 No Content
  }

  @Delete('clean-deleted')
  @ApiOperation({ summary: 'ลบรายการ soft-delete ที่เกิน 30 วัน' })
  @ApiOkResponse({
    description: 'ลบรายการที่ถูก soft delete เกิน 30 วันเรียบร้อยแล้ว',
    type: CronCleanupResponseDto,
  })
  async deleteOldSoftDeleted() {
    const deleted = await this.cartService.deletePermanentlyOlderThan30Days();
    return plainToInstance(CronCleanupResponseDto, {
      softDeletedCount: 0,
      hardDeletedCount: deleted,
      source: 'manual',
    });
  }

  @Delete('cleanup-old')
  @ApiOperation({ summary: 'ลบรายการตะกร้าที่เก่ากว่า 7 วัน (soft delete)' })
  @ApiOkResponse({
    description: 'ลบรายการที่เก่ากว่า 7 วันแบบ soft delete แล้ว',
    type: CronCleanupResponseDto,
  })
  async softDeleteOldCarts() {
    const softDeleted = await this.cartService.softDeleteOlderThan7Days();
    return plainToInstance(CronCleanupResponseDto, {
      softDeletedCount: softDeleted,
      hardDeletedCount: 0,
      source: 'manual',
    });
  }
}
