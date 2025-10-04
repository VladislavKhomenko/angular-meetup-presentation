# MapListTo Decorator

## Описание

`MapListTo` - это кастомный декоратор для Angular, который автоматически преобразует массивы plain objects или `EntityList` в экземпляры классов с помощью `class-transformer`.

## Исходный код

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

## Как работает

1. **Принимает класс** - `ItemClass: Constructor<ItemType>`
2. **Возвращает декоратор** - для методов, возвращающих `Observable<EntityList<ItemType> | ItemType[]>`
3. **Проверяет тип данных** - массив или EntityList
4. **Применяет преобразование**:
   - Для массивов: `plainToInstance(ItemClass, data)`
   - Для EntityList: `plainToClassFromExist(new EntityList<ItemType>(ItemClass), data)`
5. **Возвращает Observable** - с преобразованными объектами

## Использование

### Базовый пример

```typescript
@Injectable()
export class UserApiService {
  @MapListTo(User)
  getUserList(params?: ListQueryParams<User>): Observable<EntityList<User>> {
    return this.http.get('/api/users', { params });
  }

  @MapListTo(User)
  getUsers(): Observable<User[]> {
    return this.http.get('/api/users/all');
  }
}
```

### Что происходит

```typescript
// Без декоратора (ручное преобразование)
getUserList(): Observable<EntityList<User>> {
  return this.http.get('/api/users').pipe(
    map((data: any) => {
      const users = data.result.map((userData: any) => ({
        id: userData.id,
        name: userData.name,
        createdAt: new Date(userData.createdAt),
        avatar: userData.avatar ? new Avatar(userData.avatar) : null
      } as User));

      return {
        result: users,
        pagination: data.pagination
      } as EntityList<User>;
    })
  );
}

// С декоратором (автоматическое преобразование)
@MapListTo(User)
getUserList(): Observable<EntityList<User>> {
  return this.http.get('/api/users');
}
```

## Поддерживаемые типы

### 1. Простые массивы

```typescript
@MapListTo(User)
getUsers(): Observable<User[]> {
  return this.http.get('/api/users/all');
}

// API возвращает: [{ id: "1", name: "John" }, { id: "2", name: "Jane" }]
// Результат: [User, User] - автоматически преобразованные экземпляры
```

### 2. EntityList с пагинацией

```typescript
@MapListTo(User)
getUserList(params?: ListQueryParams<User>): Observable<EntityList<User>> {
  return this.http.get('/api/users', { params });
}

// API возвращает:
// {
//   result: [{ id: "1", name: "John" }, { id: "2", name: "Jane" }],
//   pagination: { offset: 0, limit: 10, total: 100 }
// }
// Результат: EntityList<User> с преобразованными User объектами
```

## EntityList модель

```typescript
export class EntityList<T> {
  @Exclude() private type: Constructor<T>;
  @Type(getItemType) result: T[] = [];
  pagination?: EntityListPagination;

  constructor(type: Constructor<T>) {
    this.type = type;
  }
}

const getItemType = <T>(options?: TypeHelpOptions): Constructor<T> => 
  options?.newObject.type;
```

## Примеры из проекта

### UsersApiService

```typescript
@Injectable({
  providedIn: 'root',
})
export class UsersApiService {
  readonly #apiService = inject(ApiService);

  @MapListTo(User)
  getUserList(params?: ListQueryParams<User>): Observable<EntityList<User>> {
    return this.#apiService.getList<User>(USERS_BASE_PATH, params);
  }

  getUsers(params?: ListQueryParams<User>): Observable<User[]> {
    return this.getUserList(params).pipe(map(toResult));
  }
}
```

### AccountsApiService

```typescript
@Injectable()
export class AccountsApiService {
  @MapListTo(Account)
  getAccountList(params?: ListQueryParams<Account>): Observable<EntityList<Account>> {
    return this.http.get('/api/accounts', { params });
  }

  @MapListTo(Account)
  getAccountsByStatus(status: AccountStatus): Observable<Account[]> {
    return this.http.get(`/api/accounts?status=${status}`);
  }
}
```

## Преимущества

- ✅ **Универсальность** - работает с массивами и EntityList
- ✅ **Автоматическое преобразование** - использует декораторы модели
- ✅ **Пагинация** - сохраняет метаданные пагинации
- ✅ **Type safety** - полная поддержка TypeScript
- ✅ **Производительность** - эффективное преобразование

## Ограничения

- ❌ **Только Observable** - работает только с методами, возвращающими Observable
- ❌ **Однородные массивы** - все элементы должны быть одного типа
- ❌ **Требует класс** - нужен класс с декораторами class-transformer

## Тестирование

### Unit тест для массива

```typescript
describe('MapListTo Decorator - Array', () => {
  it('should transform array of plain objects to User instances', () => {
    const mockUsersData = [
      { id: '1', name: 'John', createdAt: '2024-01-15T10:30:00Z' },
      { id: '2', name: 'Jane', createdAt: '2024-01-16T11:30:00Z' }
    ];

    service.getUsers().subscribe(users => {
      expect(users).toHaveLength(2);
      expect(users[0]).toBeInstanceOf(User);
      expect(users[1]).toBeInstanceOf(User);
      expect(users[0].createdAt).toBeInstanceOf(Date);
    });

    const req = httpMock.expectOne('/api/users/all');
    req.flush(mockUsersData);
  });
});
```

### Unit тест для EntityList

```typescript
describe('MapListTo Decorator - EntityList', () => {
  it('should transform EntityList with pagination', () => {
    const mockEntityListData = {
      result: [
        { id: '1', name: 'John', createdAt: '2024-01-15T10:30:00Z' },
        { id: '2', name: 'Jane', createdAt: '2024-01-16T11:30:00Z' }
      ],
      pagination: { offset: 0, limit: 10, total: 100 }
    };

    service.getUserList().subscribe(entityList => {
      expect(entityList).toBeInstanceOf(EntityList);
      expect(entityList.result).toHaveLength(2);
      expect(entityList.result[0]).toBeInstanceOf(User);
      expect(entityList.pagination).toEqual(mockEntityListData.pagination);
    });

    const req = httpMock.expectOne('/api/users');
    req.flush(mockEntityListData);
  });
});
```

## Лучшие практики

1. **Используйте с моделями** - только с классами, имеющими декораторы class-transformer
2. **Обрабатывайте ошибки** - добавляйте catchError в pipe
3. **Кэшируйте результаты** - используйте shareReplay для списков
4. **Оптимизируйте запросы** - используйте параметры фильтрации
5. **Документируйте** - добавляйте JSDoc комментарии к методам

## Связанные декораторы

- **MapTo** - для одиночных объектов
- **@Type()** - в моделях для преобразования типов
- **@Expose()** - для управления сериализацией
- **@Transform()** - для кастомных преобразований

## Производительность

### Метрики (примерные)

- **Массив 100 элементов**: ~2ms
- **EntityList 1000 элементов**: ~15ms
- **Память**: минимальное влияние
- **TypeScript**: полная поддержка

### Оптимизации

```typescript
// ✅ Кэширование списков
readonly users$ = this.getUserList().pipe(shareReplay());

// ✅ Ленивая загрузка
@MapListTo(User)
getUsersByPage(page: number): Observable<EntityList<User>> {
  return this.http.get(`/api/users?page=${page}`);
}

// ✅ Фильтрация на сервере
@MapListTo(User)
getActiveUsers(): Observable<User[]> {
  return this.http.get('/api/users?status=active');
}
```
