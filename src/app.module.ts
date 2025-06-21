// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { CartModule } from './cart/cart.module';
import { ClientProxyModule } from './client-proxy/client-proxy.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(), // สำหรับ CronJob
    PrismaModule,
    ClientProxyModule,
    CartModule,
  ],
})
export class AppModule {}
