import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StoresController } from './stores.controller';
import { StoresService } from './stores.service';
import { Store, StoreSchema } from './schemas/store.schema';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: Store.name,
        useFactory: () => {
          return StoreSchema;
        },
      },
    ]),
    UsersModule, // We'll need this to validate store owners
  ],
  controllers: [StoresController],
  providers: [StoresService],
  exports: [StoresService], // Export so other modules can use it
})
export class StoresModule { }