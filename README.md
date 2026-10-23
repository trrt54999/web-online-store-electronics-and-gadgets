Розроблення REST-ендпоінтів засобами NestJS  
**Варіант:** №1 (Категорія: «Електроніка та гаджети», префікс маршруту: `/gadgets`)  

---

## Мета
- Опанувати архітектурні засади фреймворку NestJS: модульну організацію, інверсію керування (IoC) та ін’єкцію залежностей (Dependency Injection).
- Навчитися створювати та конфігурувати проєкт за допомогою `@nestjs/cli`, дослідити призначення вхідної точки застосунку `main.ts` та кореневого модуля `AppModule`.
- Опанувати розробку REST-контролерів із маршрутизацією через декоратори методів (`@Get`, `@Post`, `@Patch`, `@Delete`).
- Навчитися витягувати дані з HTTP-запитів за допомогою декораторів параметрів (`@Param`, `@Query`, `@Body`, `@Headers`) та формувати типізовані контракти DTO (Data Transfer Objects).
- Реалізувати інкапсуляцію бізнес-логіки в сервісному провайдері з in-memory сховищем та налаштувати коректні HTTP-статуси й виключення (`NotFoundException`).

---

## 2. Електроніка та гаджети
* **Категорія:** Електроніка та гаджети
* **Базовий префікс маршруту:** `/gadgets`
* **Поля сутності (CreateDto):**
  * `title`: string (назва гаджета)
  * `price`: number (ціна)
  * `warrantyMonths`: number (гарантія в місяцях)
  * `cpu`: string (процесор)
  * `ramGb`: number (обсяг оперативної пам'яті в ГБ)

---

## 3. Структура проєкту

```text
online-store-electronics-and-gadgets/
├── src/
│   ├── gadgets/
│   │   ├── dto/
│   │   │   ├── create-gadgets.dto.ts
│   │   │   └── update-gadgets.dto.ts
│   │   ├── entity/
│   │   │   └── gadgets.entity.ts
│   │   ├── gadgets.controller.ts
│   │   ├── gadgets.module.ts
│   │   └── gadgets.service.ts
.....................................
```

---

## 4. Хід роботи

### Ініціалізація та оголошення контрактів DTO

1. **Створення проєкту:**
   Проєкт ініціалізовано за допомогою NestJS CLI:
   ```bash
   npx @nestjs/cli new online-store-electronics-and-gadgets --strict --package-manager npm
   ```

2. **Генерація модуля та контролера:**
   ```bash
   npx @nestjs/cli g module gadgets
   npx @nestjs/cli g co gadgets --no-spec
   npx @nestjs/cli g s gadgets --no-spec
   ```

3. **Створення DTO та Entity:**

`src/gadgets/entity/gadgets.entity.ts`
```typescript
export class GadgetsEntity {
  id: string;
  title: string;
  price: number;
  warrantyMonths: number;
  cpu: string;
  ramGb: number;
}
```

`src/gadgets/dto/create-gadgets.dto.ts`
```typescript
export class CreateGadgetsDto {
  readonly title: string;
  readonly price: number;
  readonly warrantyMonths: number;
  readonly cpu: string;
  readonly ramGb: number;
}
```

`src/gadgets/dto/update-gadgets.dto.ts`
```typescript
export class UpdateGadgetsDto {
  readonly title?: string;
  readonly price?: number;
  readonly warrantyMonths?: number;
  readonly cpu?: string;
  readonly ramGb?: number;
}
```

---

### Рівень 2 та 3. Повний REST CRUD, In-Memory Service, Query-фільтрація та Headers

#### Сервіс (`src/gadgets/gadgets.service.ts`)
Реалізує in-memory сховище з початковими даними, методи CRUD, обробку помилок (`NotFoundException`), регістронезалежний пошук та обмеження кількості результатів (`slice`).

```typescript
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
```

#### Контролер (`src/gadgets/gadgets.controller.ts`)
Приймає запити, використовує декоратори параметрів (`@Query`, `@Param`, `@Body`), налаштовує HTTP-статуси (`@HttpCode`) та додає кастомні заголовки відповіді (`@Header`).

```typescript
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

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string) {
    this.gadgetsService.remove(id);
  }
}
```

#### Точка входу (`src/main.ts`)
```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

---

## 5. Демонстрація тестування API (Postman / HTTP Client)

Нижче наведено результати тестування розроблених ендпоінтів.

### 1. Отримання всіх записів та перевірка заголовків
* **Request:** `GET http://localhost:3000/gadgets`
* **Очікуваний результат:** Статус `200 OK`, масив елементів та наявність заголовків `X-API-Version: 1.0`, `X-Service-Status: operational`.

<img width="1273" height="802" alt="image" src="https://github.com/user-attachments/assets/c5bd31cd-12f9-4772-9956-0fb5d40ba31d" />
<img width="1265" height="796" alt="image" src="https://github.com/user-attachments/assets/abc2fc36-f5cc-4551-b5e1-319aeb1fd765" />


---

### 2. Пошук та фільтрація (Query Params)
* **Request:** `GET http://localhost:3000/gadgets?search=phone`
* **Очікуваний результат:** Повертає тільки об'єкт "Phone", незалежно від регістру.

<img width="1261" height="795" alt="image" src="https://github.com/user-attachments/assets/9799bc6b-0c17-4bb9-90f8-0c6a24bfa391" />


---

### 3. Обмеження кількості записів (Limit)
* **Request:** `GET http://localhost:3000/gadgets?limit=1`
* **Очікуваний результат:** Повертається лише перша сутність із масиву.

<img width="1271" height="802" alt="image" src="https://github.com/user-attachments/assets/e950d618-3807-44b4-b87b-75b258ec8cc9" />


---

### 4. Отримання запису за ID
* **Request:** `GET http://localhost:3000/gadgets/3`
* **Очікуваний результат:** Статус `200 OK` та об'єкт гаджет з ID "3".

<img width="1269" height="782" alt="image" src="https://github.com/user-attachments/assets/a5357cfe-cd81-4bce-a995-4400c2e8e0bb" />


---

### 5. Обробка помилки 404 (Not Found)
* **Request:** `GET http://localhost:3000/gadgets/99999`
* **Очікуваний результат:** Статус `404 Not Found`, JSON з повідомленням про помилку.

<img width="1270" height="794" alt="image" src="https://github.com/user-attachments/assets/e5f9536f-9a47-4549-8643-0ccbcf03ed43" />


---

### 6. Створення нового запису (POST)
* **Request:** `POST http://localhost:3000/gadgets`
* **Headers:** `Content-Type: application/json`
* **Body:**
```json
{
  "title": "Smart Watch",
  "price": 3000,
  "warrantyMonths": 12,
  "cpu": "Apple S9",
  "ramGb": 2
}
```
* **Очікуваний результат:** Статус `201 Created` та новий об'єкт із згенерованим `id` (UUID).

<img width="1270" height="790" alt="image" src="https://github.com/user-attachments/assets/e20fa7db-83c0-427c-aefb-4ad42c2f83a1" />


---

### 7. Видалення запису (DELETE)
* **Request:** `DELETE http://localhost:3000/gadgets/1`
* **Очікуваний результат:** Статус `204 No Content` без тіла відповіді.

<img width="1269" height="791" alt="image" src="https://github.com/user-attachments/assets/7f570608-35c4-4c59-abef-dfd4eb5c4214" />


---

## 6. Висновки
Під час виконання практичної роботи було опановано базові та просунуті концепції TypeScript-фреймворку NestJS. Було розроблено RESTful API для ресурсу «Електроніка та гаджети» (/gadgets). 

Зокрема:
1. Організовано чітку модульну структуру із розділенням відповідей між контролером та сервісом за принципами IoC/DI.
2. Створено типізовані контракти DTO та сутності Entity.
3. Реалізовано повний CRUD-цикл операцій із підтримкою вбудованого in-memory сховища.
4. Налаштовано коректні HTTP-статуси відповіді (`201 Created`, `204 No Content`, `404 Not Found`) та кастомні response-заголовки (`@Header`).
5. Реалізовано регістронезалежний пошук та обмеження вибірки за допомогою Query-параметрів.
6. Проведено комплексне тестування розроблених ендпоінтів у Postman.
