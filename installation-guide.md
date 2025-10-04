# Руководство по установке и настройке class-transformer

## 1. Установка зависимостей

### npm

```bash
npm install class-transformer class-validator reflect-metadata
npm install --save-dev @types/node
```

### yarn

```bash
yarn add class-transformer class-validator reflect-metadata
yarn add -D @types/node
```

### pnpm

```bash
pnpm add class-transformer class-validator reflect-metadata
pnpm add -D @types/node
```

## 2. Настройка TypeScript

### tsconfig.json

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "target": "ES2020",
    "lib": ["ES2020", "DOM"],
    "module": "ES2020",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### Ключевые настройки:

- `"experimentalDecorators": true` - включает поддержку декораторов
- `"emitDecoratorMetadata": true` - включает метаданные для class-transformer
- `"target": "ES2020"` - современная версия JavaScript

## 3. Настройка Angular

### main.ts

```typescript
import 'reflect-metadata';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
```

### Важно: импорт reflect-metadata должен быть первым!

## 4. Создание базовых декораторов

### libs/core/decorators/map-to/map-to.decorator.ts

```typescript
/* eslint-disable @typescript-eslint/no-explicit-any */
import { plainToInstance } from 'class-transformer';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Constructor } from '@monowork/core/models';

export const MapTo =
  <ItemType extends object>(targetClass: Constructor<ItemType>) =>
  <MethodType extends (...args: any[]) => Observable<ItemType>>(
    _target: any,
    _methodName: string | symbol,
    descriptor: TypedPropertyDescriptor<MethodType>,
  ): TypedPropertyDescriptor<MethodType> => {
    const originalMethod = descriptor.value;

    descriptor.value = function (this: any, ...args: any[]) {
      const toInstance = (dto: ItemType): ItemType => plainToInstance(targetClass, dto);

      return originalMethod?.apply(this, args).pipe(map(toInstance));
    } as MethodType;

    return descriptor;
  };
```

### libs/core/decorators/map-list-to/map-list-to.decorator.ts

```typescript
/* eslint-disable @typescript-eslint/no-explicit-any */
import { plainToClassFromExist, plainToInstance } from 'class-transformer';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Constructor, EntityList } from '@monowork/core/models';

export const MapListTo =
  <ItemType>(ItemClass: Constructor<ItemType>) =>
  <MethodType extends (...args: any[]) => Observable<EntityList<ItemType> | ItemType[]>>(
    _target: any,
    _methodName: string | symbol,
    descriptor: TypedPropertyDescriptor<MethodType>,
  ): TypedPropertyDescriptor<MethodType> => {
    const originalMethod = descriptor.value;

    descriptor.value = function (this: any, ...args: any[]) {
      const toList = (data: EntityList<ItemType> | ItemType[]): EntityList<ItemType> | ItemType[] => {
        if (Array.isArray(data)) {
          const model = plainToInstance(ItemClass, data);
          return model;
        }

        const model = plainToClassFromExist(new EntityList<ItemType>(ItemClass), data);
        return model;
      };

      return originalMethod?.apply(this, args).pipe(map(toList));
    } as MethodType;

    return descriptor;
  };
```

## 5. Создание helper функций

### libs/core/helpers/map-instance-to-plain/map-instance-to-plain.helper.ts

```typescript
import { instanceToPlain, plainToInstance } from 'class-transformer';

import { Constructor } from '@monowork/core/models';

export const mapInstanceToPlain = <T>(
  SourceClass: Constructor<T>, 
  sourceObject: T
): Record<string, unknown> => {
  return instanceToPlain<T>(plainToInstance<T, Partial<T>>(SourceClass, sourceObject));
};
```

## 6. Создание базовых моделей

### libs/core/models/constructor.model.ts

```typescript
export type Constructor<T = {}> = new (...args: any[]) => T;
```

### libs/core/models/entity-list.model.ts

```typescript
import { Exclude, Type, TypeHelpOptions } from 'class-transformer';
import { Constructor } from './constructor.model';

const getItemType = <T>(options?: TypeHelpOptions): Constructor<T> => options?.newObject.type;

export class EntityList<T> {
  @Exclude() private type: Constructor<T>;
  @Type(getItemType) result: T[] = [];
  pagination?: EntityListPagination;

  constructor(type: Constructor<T>) {
    this.type = type;
  }
}

export interface EntityListPagination {
  offset: number;
  limit: number;
  total: number;
}
```

## 7. Создание базовых типов

### libs/core/types/nullable.type.ts

```typescript
export type Nullable<T> = T | null;
```

## 8. Создание базовых helper функций

### libs/core/helpers/to-id/to-id.helper.ts

```typescript
export const toId = <T extends { id: string }>(object: T): string => {
  return object.id;
};
```

## 9. Настройка экспортов

### libs/core/decorators/index.ts

```typescript
export * from './map-to/map-to.decorator';
export * from './map-list-to/map-list-to.decorator';
```

### libs/core/helpers/index.ts

```typescript
export * from './map-instance-to-plain/map-instance-to-plain.helper';
export * from './to-id/to-id.helper';
```

### libs/core/models/index.ts

```typescript
export * from './constructor.model';
export * from './entity-list.model';
```

### libs/core/types/index.ts

```typescript
export * from './nullable.type';
```

### libs/core/index.ts

```typescript
export * from './decorators';
export * from './helpers';
export * from './models';
export * from './types';
```

## 10. Создание первой модели

### libs/sparta/api/users/src/models/user.model.ts

```typescript
import { Expose, Transform, TransformFnParams, Type } from 'class-transformer';
import { Permission } from '@monowork/core/enums';
import { Nullable } from '@monowork/core/types';
import { toId } from '@monowork/core/helpers';

class Avatar {
  id: string;
  filePath: string;
  name: string;
  mime: string;
  originalFilename: string;
  checksum: string;
  privacyPolicy: string;
  uploadedBy: User;

  get uploadedByNickname(): string {
    return this.uploadedBy.nickname;
  }
}

export class User {
  @Type(() => Date) createdAt?: Date;
  @Type(() => Date) updatedAt?: Date;

  @Expose({ name: 'avatarId', toPlainOnly: true })
  @Transform((params: TransformFnParams) => (params.value ? toId(params.value) : null), { toPlainOnly: true })
  @Type(() => Avatar)
  avatar?: Nullable<Avatar>;

  id: string;
  nickname: string;
  externalId?: string;
  email: string;
  isEmailVerified?: boolean;
  avatarId?: string;
  permissions: Permission[];

  get fullName(): string {
    return `${this.nickname} (${this.email})`;
  }
}
```

## 11. Создание первого API сервиса

### libs/sparta/api/users/src/services/users-api/users-api.service.ts

```typescript
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { MapListTo, MapTo } from '@monowork/core/decorators';
import { mapInstanceToPlain } from '@monowork/core/helpers';
import { EntityList, ListQueryParams } from '@monowork/core/models';
import { ApiService } from '@monowork/core/services';

import { User } from '../../models';

@Injectable({
  providedIn: 'root',
})
export class UsersApiService {
  readonly #apiService = inject(ApiService);

  @MapListTo(User)
  getUserList(params?: ListQueryParams<User>): Observable<EntityList<User>> {
    return this.#apiService.getList<User>('/api/users', params);
  }

  @MapTo(User)
  getProfile(): Observable<User> {
    return this.#apiService.get<User>('/api/users/profile');
  }

  @MapTo(User)
  updateUser(user: Partial<User>): Observable<User> {
    const transformedUser = mapInstanceToPlain(User, user);
    return this.#apiService.patch<User>('/api/users/profile', transformedUser);
  }
}
```

## 12. Настройка тестирования

### jest.config.ts

```typescript
module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|mjs|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
      },
    ],
  },
  transformIgnorePatterns: [
    'node_modules/(?!.*\\.mjs$)',
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.d.ts',
  ],
};
```

### src/test-setup.ts

```typescript
import 'reflect-metadata';
import 'jest-preset-angular/setup-jest';
```

## 13. Создание тестов

### libs/core/decorators/map-to/map-to.decorator.spec.ts

```typescript
import { of } from 'rxjs';
import { MapTo } from './map-to.decorator';

class TestModel {
  id: string;
  name: string;
}

class TestService {
  @MapTo(TestModel)
  getData(): Observable<TestModel> {
    return of({ id: '1', name: 'Test' } as any);
  }
}

describe('MapTo Decorator', () => {
  let service: TestService;

  beforeEach(() => {
    service = new TestService();
  });

  it('should transform plain object to TestModel instance', () => {
    service.getData().subscribe(result => {
      expect(result).toBeInstanceOf(TestModel);
      expect(result.id).toBe('1');
      expect(result.name).toBe('Test');
    });
  });
});
```

## 14. Настройка ESLint

### .eslintrc.json

```json
{
  "extends": ["@angular-eslint/recommended"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/explicit-function-return-type": "off"
  }
}
```

## 15. Проверка установки

### Создайте тестовый компонент

```typescript
import { Component, OnInit } from '@angular/core';
import { UsersApiService } from '@sparta/api/users';

@Component({
  selector: 'app-test',
  template: `
    <div *ngIf="user$ | async as user">
      <h2>{{ user.nickname }}</h2>
      <p>Email: {{ user.email }}</p>
      <p>Created: {{ user.createdAt | date }}</p>
    </div>
  `
})
export class TestComponent implements OnInit {
  user$ = this.usersApiService.getProfile();

  constructor(private usersApiService: UsersApiService) {}

  ngOnInit() {
    // Автоматическое преобразование должно работать
  }
}
```

## 16. Возможные проблемы и решения

### Проблема: "reflect-metadata is not defined"

**Решение**: Убедитесь, что `reflect-metadata` импортирован первым в `main.ts`

### Проблема: "Experimental decorators are not enabled"

**Решение**: Проверьте настройки в `tsconfig.json`:
```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

### Проблема: "Cannot find module 'class-transformer'"

**Решение**: Установите зависимости:
```bash
npm install class-transformer class-validator reflect-metadata
```

### Проблема: Декораторы не работают

**Решение**: Проверьте, что:
1. `reflect-metadata` импортирован
2. Настройки TypeScript корректны
3. Декораторы правильно применены

## 17. Следующие шаги

1. **Создайте больше моделей** - используйте декораторы для сложных преобразований
2. **Добавьте валидацию** - используйте `class-validator` для проверки данных
3. **Создайте кастомные декораторы** - для специфических случаев
4. **Настройте тестирование** - unit тесты для всех моделей
5. **Документируйте код** - JSDoc комментарии для сложной логики

## 18. Полезные ссылки

- [class-transformer документация](https://github.com/typestack/class-transformer)
- [class-validator документация](https://github.com/typestack/class-validator)
- [Angular HTTP Guide](https://angular.io/guide/http)
- [TypeScript Decorators](https://www.typescriptlang.org/docs/handbook/decorators.html)
- [RxJS Operators](https://rxjs.dev/guide/operators)
