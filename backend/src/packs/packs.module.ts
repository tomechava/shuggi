import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { PacksController } from './packs.controller';
import { PacksService } from './packs.service';
import { Pack, PackSchema } from './schemas/pack.schema';
import { StoresModule } from '../stores/stores.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Pack.name, schema: PackSchema }
    ]),
    ConfigModule, // Para usar ConfigService en PacksService
    StoresModule, // Para validar que las tiendas existen
  ],
  controllers: [PacksController],
  providers: [PacksService],
  exports: [PacksService], // Para usar en módulo de Orders (Sprint 4)
})
export class PacksModule { }