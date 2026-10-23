import { Injectable, NotFoundException } from '@nestjs/common';
import { GadgetsEntity } from './entity/gadgets.entity.js';
import { CreateGadgetsDto } from './dto/create-gadgets.dto.js';
import { randomUUID } from 'crypto';
import { UpdateGadgetsDto } from './dto/update-gadgets.dto.js';

@Injectable()
export class GadgetsService {
  private items: GadgetsEntity[] = [
    {
      id: '1',
      title: 'PC',
      price: 30000,
      warrantyMonths: 6,
      cpu: 'Ryzen 9 5900 X',
      ramGb: 32,
    },
    {
      id: '2',
      title: 'Phone',
      price: 5000,
      warrantyMonths: 12,
      cpu: 'Snapdragon 8 Elite Gen 6',
      ramGb: 8,
    },
    {
      id: '3',
      title: 'Tablet',
      price: 15000,
      warrantyMonths: 24,
      cpu: 'Snapdragon X Elite',
      ramGb: 16,
    },
  ];

  findAll(search?: string, limit?: number) {
    let items = this.items;

    if (search) {
      items = this.items.filter((item) =>
        item.title.toLowerCase().includes(search.toLowerCase()),
      );
    }

    if (limit) {
      items = items.slice(0, limit);
    }

    return items;
  }

  findOne(id: string) {
    const item = this.items.find((item) => item.id === id);

    if (!item || id === '0') {
      throw new NotFoundException(`Entity with ID: ${id} not found!`);
    }

    return item;
  }

  create(dto: CreateGadgetsDto) {
    const newGadget = {
      id: randomUUID(),
      ...dto,
    };

    this.items.push(newGadget);

    return newGadget;
  }

  update(id: string, dto: UpdateGadgetsDto) {
    const gadgetToUpdate = this.findOne(id);
    const index = this.items.indexOf(gadgetToUpdate);

    const updatedGadget = {
      ...gadgetToUpdate,
      ...dto,
    };

    this.items[index] = updatedGadget;

    return updatedGadget;
  }

  remove(id: string) {
    const gadgetToDelete = this.findOne(id);
    const index = this.items.indexOf(gadgetToDelete);

    this.items.splice(index, 1);
  }
}
