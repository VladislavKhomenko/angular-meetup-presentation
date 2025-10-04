# MapTo Decorator

## Описание

`MapTo` - это кастомный декоратор для Angular, который автоматически преобразует plain objects в экземпляры классов с помощью `class-transformer`.

## Исходный код

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

## Как работает

1. **Принимает класс** - `targetClass: Constructor<ItemType>`
2. **Возвращает декоратор** - для методов, возвращающих `Observable<ItemType>`
3. **Перехватывает вызов** - оригинального метода
4. **Применяет преобразование** - `plainToInstance(targetClass, dto)`
5. **Возвращает Observable** - с преобразованным объектом

## Использование

### Базовый пример

```typescript
@Injectable()
export class UserApiService {
  @MapTo(User)
  getUser(id: string): Observable<User> {
    return this.http.get(`/api/users/${id}`);
  }
}
```

### Что происходит

```typescript
// Без декоратора (ручное преобразование)
getUser(id: string): Observable<User> {
  return this.http.get(`/api/users/${id}`).pipe(
    map((data: any) => {
      return {
        id: data.id,
        name: data.name,
        createdAt: new Date(data.createdAt),
        avatar: data.avatar ? new Avatar(data.avatar) : null
      } as User;
    })
  );
}

// С декоратором (автоматическое преобразование)
@MapTo(User)
getUser(id: string): Observable<User> {
  return this.http.get(`/api/users/${id}`);
}
```

## Преимущества

- ✅ **Меньше кода** - убирает boilerplate
- ✅ **Автоматическое преобразование** - использует декораторы модели
- ✅ **Type safety** - полная поддержка TypeScript
- ✅ **Переиспользование** - один декоратор для всех методов
- ✅ **Читаемость** - декларативный подход

## Ограничения

- ❌ **Только Observable** - работает только с методами, возвращающими Observable
- ❌ **Одиночные объекты** - для массивов используйте MapListTo
- ❌ **Требует класс** - нужен класс с декораторами class-transformer

## Примеры из проекта

### UsersApiService

```typescript
@Injectable({
  providedIn: 'root',
})
export class UsersApiService {
  readonly #apiService = inject(ApiService);

  @MapTo(User)
  getProfile(): Observable<User> {
    return this.#apiService.get<User>(USERS_PROFILE_PATH);
  }

  @MapTo(User)
  updateUser(user: Partial<User>): Observable<User> {
    const transformedUser = mapInstanceToPlain(User, user);
    return this.#apiService.patch<User>(USERS_PROFILE_PATH, transformedUser);
  }
}
```

### AccountsApiService

```typescript
@Injectable()
export class AccountsApiService {
  @MapTo(Account)
  getAccount(id: string): Observable<Account> {
    return this.http.get(`/api/accounts/${id}`);
  }

  @MapTo(Account)
  createAccount(account: Partial<Account>): Observable<Account> {
    return this.http.post('/api/accounts', account);
  }
}
```

## Тестирование

### Unit тест

```typescript
describe('MapTo Decorator', () => {
  let service: UserApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserApiService]
    });
    service = TestBed.inject(UserApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should transform plain object to User instance', () => {
    const mockUserData = {
      id: '123',
      name: 'John Doe',
      createdAt: '2024-01-15T10:30:00Z',
      avatar: {
        id: '456',
        url: 'https://example.com/avatar.jpg'
      }
    };

    service.getUser('123').subscribe(user => {
      expect(user).toBeInstanceOf(User);
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.avatar).toBeInstanceOf(Avatar);
    });

    const req = httpMock.expectOne('/api/users/123');
    req.flush(mockUserData);
  });
});
```

## Лучшие практики

1. **Используйте с моделями** - только с классами, имеющими декораторы class-transformer
2. **Обрабатывайте ошибки** - добавляйте catchError в pipe
3. **Кэшируйте результаты** - используйте shareReplay для часто запрашиваемых данных
4. **Документируйте** - добавляйте JSDoc комментарии к методам

## Связанные декораторы

- **MapListTo** - для массивов и EntityList
- **@Type()** - в моделях для преобразования типов
- **@Expose()** - для управления сериализацией
- **@Transform()** - для кастомных преобразований
