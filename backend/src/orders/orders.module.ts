import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order, OrderSchema } from './schemas/order.schema';
import { PacksModule } from '../packs/packs.module';
import { StoresModule } from '../stores/stores.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema }
    ]),
    ConfigModule,
    PacksModule,   // Para acceder a packs
    StoresModule,  // Para validar tiendas
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService], // Para usar en otros módulos (ej: Payments en Sprint 5)
})
export class OrdersModule { }