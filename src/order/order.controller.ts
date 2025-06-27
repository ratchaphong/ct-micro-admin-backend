import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { OrderService } from './order.service';
import { OrderResponseDto } from './dto/order-response.dto';
import { plainToInstance } from 'class-transformer';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from 'src/cart/jwt-auth.guard';
import { PaginateOrderDto } from './dto/paginate-order.dto';

@ApiTags('Order')
@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'สร้าง Order และลบ Cart' })
  @ApiCreatedResponse({
    description: 'สร้าง Order สำเร็จ',
    type: OrderResponseDto,
  })
  async createOrder(@Body() dto: CreateOrderDto, @Req() req: any) {
    const userId = req.user.id;
    const order = await this.orderService.createOrder(userId, dto);
    return plainToInstance(OrderResponseDto, order);
  }

  @Get()
  @ApiOperation({ summary: 'ค้นหา Order (paginate)' })
  @ApiOkResponse({
    description: 'รายการ Order',
    type: OrderResponseDto,
    isArray: true,
  })
  async findAll(@Query() query: PaginateOrderDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;

    const skip = (page - 1) * limit;
    const take = limit;

    const orders = await this.orderService.findAll(skip, take);
    return orders.map((o) => plainToInstance(OrderResponseDto, o));
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('my')
  @ApiOperation({ summary: 'ค้นหา Order ของตัวเอง' })
  @ApiOkResponse({
    description: 'Order ของผู้ใช้งาน',
    type: OrderResponseDto,
    isArray: true,
  })
  async findMine(@Req() req: any) {
    const userId = req.user.id;
    const orders = await this.orderService.findMine(userId);
    return orders.map((o) => plainToInstance(OrderResponseDto, o));
  }
}
