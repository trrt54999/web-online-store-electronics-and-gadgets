import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { GadgetsController } from './gadgets/gadgets.controller.js';
import { GadgetsService } from './gadgets/gadgets.service.js';

@Module({
  imports: [],
  controllers: [AppController, GadgetsController],
  providers: [AppService, GadgetsService],
})
export class AppModule {}
