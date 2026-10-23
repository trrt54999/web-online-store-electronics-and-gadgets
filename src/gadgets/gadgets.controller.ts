import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  Injectable,
  Delete,
  Header,
} from '@nestjs/common';
import { CreateGadgetsDto } from './dto/create-gadgets.dto.js';
import { GadgetsService } from './gadgets.service.js';

@Injectable()
@Controller('gadgets')
export class GadgetsController {
  constructor(private readonly gadgetsService: GadgetsService) {}

  @Get()
  @Header('X-API-Version', '1.0')
  @Header('X-Service-Status', 'operational')
  findAll(@Query('search') search?: string, @Query('limit') limit?: number) {
    return this.gadgetsService.findAll(search, limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.gadgetsService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createGadgetDto(@Body() gadget: CreateGadgetsDto) {
    return this.gadgetsService.create(gadget);
  }

  @Delete(`:id`)
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string) {
    this.gadgetsService.remove(id);
  }
}
