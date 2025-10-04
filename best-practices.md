# Лучшие практики использования class-transformer в Angular

## 1. Структура моделей

### ✅ Правильно

```typescript
export class User {
  // Основные поля
  id: string;
  name: string;
  email: string;

  // Автоматическое преобразование дат
  @Type(() => Date) 
  createdAt: Date;
  
  @Type(() => Date) 
  updatedAt: Date;

  // Сложные преобразования с документацией
  @Expose({ name: 'avatarId', toPlainOnly: true })
  @Transform((params: TransformFnParams) => 
    (params.value ? toId(params.value) : null), 
    { toPlainOnly: true }
  )
  @Type(() => Avatar)
  avatar?: Nullable<Avatar>;

  // Геттеры для вычисляемых свойств
  get fullName(): string {
    return `${this.name} (${this.email})`;
  }
}
```

### ❌ Неправильно

```typescript
export class User {
  // Смешивание полей и декораторов
  id: string;
  @Type(() => Date) createdAt: Date;
  name: string;
  @Expose({ name: 'avatarId' }) avatar: Avatar;
  email: string;

  // Геттеры без документации
  get fullName() {
    return this.name + this.email;
  }
}
```

## 2. Декораторы

### @Type() - для преобразования типов

```typescript
// ✅ Правильно
@Type(() => Date) 
createdAt: Date;

@Type(() => User) 
author: User;

@Type(() => Avatar) 
avatar: Avatar;

// ❌ Неправильно
@Type(() => Date) 
createdAt: string; // Несоответствие типов
```

### @Expose() - для управления сериализацией

```typescript
// ✅ Правильно
@Expose({ name: 'avatarId', toPlainOnly: true })
avatar: Avatar;

@Expose({ name: 'userId', toClassOnly: true })
user: User;

// ❌ Неправильно
@Expose({ name: 'avatarId' }) // Без указания направления
avatar: Avatar;
```

### @Transform() - для кастомных преобразований

```typescript
// ✅ Правильно
@Transform((params: TransformFnParams) => 
  (params.value ? toId(params.value) : null), 
  { toPlainOnly: true }
)
avatar: Avatar;

@Transform((params: TransformFnParams) => 
  params.value ? params.value.toISOString() : null,
  { toPlainOnly: true }
)
createdAt: Date;

// ❌ Неправильно
@Transform((params) => params.value.id) // Без проверки на null
avatar: Avatar;
```

### @Exclude() - для исключения полей

```typescript
// ✅ Правильно
@Exclude({ toPlainOnly: true })
internalField: string;

@Exclude({ toClassOnly: true })
computedField: string;

// ❌ Неправильно
@Exclude() // Без указания направления
field: string;
```

## 3. API сервисы

### ✅ Правильно

```typescript
@Injectable({
  providedIn: 'root',
})
export class UserApiService {
  readonly #apiService = inject(ApiService);

  @MapListTo(User)
  getUserList(params?: ListQueryParams<User>): Observable<EntityList<User>> {
    return this.#apiService.getList<User>('/api/users', params);
  }

  @MapTo(User)
  getUser(id: string): Observable<User> {
    return this.#apiService.get<User>(`/api/users/${id}`);
  }

  @MapTo(User)
  updateUser(user: Partial<User>): Observable<User> {
    const transformedUser = mapInstanceToPlain(User, user);
    return this.#apiService.patch<User>(`/api/users/${user.id}`, transformedUser);
  }
}
```

### ❌ Неправильно

```typescript
@Injectable()
export class UserApiService {
  constructor(private http: HttpClient) {}

  // Ручное преобразование
  getUser(id: string): Observable<User> {
    return this.http.get(`/api/users/${id}`).pipe(
      map((data: any) => {
        return {
          id: data.id,
          name: data.name,
          createdAt: new Date(data.createdAt),
          // ... много кода
        } as User;
      })
    );
  }
}
```

## 4. Обработка ошибок

### ✅ Правильно

```typescript
@Injectable()
export class UserApiService {
  @MapTo(User)
  getUser(id: string): Observable<User> {
    return this.#apiService.get<User>(`/api/users/${id}`).pipe(
      catchError((error) => {
        console.error('Error fetching user:', error);
        return throwError(() => error);
      })
    );
  }
}
```

### ❌ Неправильно

```typescript
@Injectable()
export class UserApiService {
  @MapTo(User)
  getUser(id: string): Observable<User> {
    return this.#apiService.get<User>(`/api/users/${id}`); // Без обработки ошибок
  }
}
```

## 5. Тестирование

### ✅ Правильно

```typescript
describe('User Model', () => {
  it('should transform plain object to User instance', () => {
    const plainData = {
      id: '123',
      name: 'John',
      email: 'john@example.com',
      createdAt: '2024-01-15T10:30:00Z',
      avatar: {
        id: '456',
        filePath: '/avatar.jpg'
      }
    };

    const user = plainToInstance(User, plainData);

    expect(user).toBeInstanceOf(User);
    expect(user.createdAt).toBeInstanceOf(Date);
    expect(user.avatar).toBeInstanceOf(Avatar);
  });

  it('should handle null values correctly', () => {
    const plainData = {
      id: '123',
      name: 'John',
      email: 'john@example.com',
      avatar: null
    };

    const user = plainToInstance(User, plainData);

    expect(user.avatar).toBeNull();
  });
});

describe('UserApiService', () => {
  it('should return User instance', () => {
    service.getUser('123').subscribe(user => {
      expect(user).toBeInstanceOf(User);
    });

    const req = httpMock.expectOne('/api/users/123');
    req.flush(mockData);
  });
});
```

### ❌ Неправильно

```typescript
describe('UserApiService', () => {
  it('should return user data', () => {
    service.getUser('123').subscribe(user => {
      expect(user.id).toBe('123');
      expect(user.name).toBe('John');
      // Проверка каждого поля вручную
    });
  });
});
```

## 6. Производительность

### ✅ Правильно

```typescript
@Injectable()
export class UserApiService {
  // Кэширование для часто запрашиваемых данных
  readonly users$ = this.getUserList().pipe(shareReplay());

  @MapListTo(User)
  getUserList(): Observable<EntityList<User>> {
    return this.#apiService.getList<User>('/api/users');
  }

  // Ленивая загрузка
  @MapTo(User)
  getUser(id: string): Observable<User> {
    return this.#apiService.get<User>(`/api/users/${id}`);
  }
}
```

### ❌ Неправильно

```typescript
@Injectable()
export class UserApiService {
  // Загрузка данных при каждом вызове
  getUsers(): Observable<User[]> {
    return this.getUserList().pipe(map(toResult));
  }

  // Дублирование запросов
  getUserList(): Observable<EntityList<User>> {
    return this.#apiService.getList<User>('/api/users');
  }
}
```

## 7. Документация

### ✅ Правильно

```typescript
/**
 * Модель пользователя с автоматическим преобразованием типов
 * 
 * @example
 * ```typescript
 * const user = plainToInstance(User, apiData);
 * console.log(user.createdAt); // Date object
 * ```
 */
export class User {
  /**
   * Автоматическое преобразование строки даты в Date объект
   */
  @Type(() => Date) 
  createdAt: Date;

  /**
   * Сложное преобразование аватара:
   * - При сериализации: avatar → avatarId (строка)
   * - При десериализации: avatarId → avatar (объект Avatar)
   */
  @Expose({ name: 'avatarId', toPlainOnly: true })
  @Transform((params: TransformFnParams) => 
    (params.value ? toId(params.value) : null), 
    { toPlainOnly: true }
  )
  @Type(() => Avatar)
  avatar?: Nullable<Avatar>;

  /**
   * Полное имя пользователя
   */
  get fullName(): string {
    return `${this.name} (${this.email})`;
  }
}
```

### ❌ Неправильно

```typescript
export class User {
  @Type(() => Date) createdAt: Date;
  @Expose({ name: 'avatarId' }) avatar: Avatar;
  
  get fullName() {
    return this.name + this.email;
  }
}
```

## 8. Именование

### ✅ Правильно

```typescript
// Четкие имена для декораторов
@MapTo(User)
getUser(id: string): Observable<User> {}

@MapListTo(User)
getUserList(): Observable<EntityList<User>> {}

// Четкие имена для helper функций
const transformedUser = mapInstanceToPlain(User, user);
```

### ❌ Неправильно

```typescript
// Неясные имена
@MapTo(User)
get(id: string): Observable<User> {}

@MapListTo(User)
getList(): Observable<EntityList<User>> {}

// Неясные имена для helper функций
const data = mapInstanceToPlain(User, user);
```

## 9. Типизация

### ✅ Правильно

```typescript
// Строгая типизация
@MapTo(User)
getUser(id: string): Observable<User> {
  return this.#apiService.get<User>(`/api/users/${id}`);
}

// Типизированные параметры
@MapListTo(User)
getUserList(params?: ListQueryParams<User>): Observable<EntityList<User>> {
  return this.#apiService.getList<User>('/api/users', params);
}
```

### ❌ Неправильно

```typescript
// Слабая типизация
@MapTo(User)
getUser(id: any): Observable<any> {
  return this.#apiService.get(`/api/users/${id}`);
}

// Без типизации параметров
@MapListTo(User)
getUserList(params?: any): Observable<any> {
  return this.#apiService.getList('/api/users', params);
}
```

## 10. Обработка null/undefined

### ✅ Правильно

```typescript
@Transform((params: TransformFnParams) => 
  (params.value ? toId(params.value) : null), 
  { toPlainOnly: true }
)
avatar?: Nullable<Avatar>;

@Transform((params: TransformFnParams) => 
  (params.value ? params.value : undefined), 
  { toPlainOnly: true }
)
firstName = '';
```

### ❌ Неправильно

```typescript
@Transform((params: TransformFnParams) => toId(params.value)) // Без проверки на null
avatar?: Nullable<Avatar>;

@Transform((params: TransformFnParams) => params.value) // Без проверки на undefined
firstName = '';
```

## 11. Структура проекта

### ✅ Правильно

```
libs/
  core/
    decorators/
      map-to/
        map-to.decorator.ts
        map-to.decorator.spec.ts
      map-list-to/
        map-list-to.decorator.ts
        map-list-to.decorator.spec.ts
    helpers/
      map-instance-to-plain/
        map-instance-to-plain.helper.ts
        map-instance-to-plain.helper.spec.ts
  sparta/
    api/
      users/
        models/
          user.model.ts
        services/
          users-api/
            users-api.service.ts
            users-api.service.spec.ts
```

### ❌ Неправильно

```
libs/
  core/
    decorators.ts // Все декораторы в одном файле
    helpers.ts    // Все helpers в одном файле
  sparta/
    api/
      users/
        user.ts   // Модель и сервис в одном файле
```

## 12. Импорты

### ✅ Правильно

```typescript
import { Expose, Transform, TransformFnParams, Type } from 'class-transformer';
import { MapTo, MapListTo } from '@monowork/core/decorators';
import { mapInstanceToPlain } from '@monowork/core/helpers';
import { EntityList, ListQueryParams } from '@monowork/core/models';
```

### ❌ Неправильно

```typescript
import * as classTransformer from 'class-transformer';
import { MapTo, MapListTo, mapInstanceToPlain } from '@monowork/core';
```

## Итоговые рекомендации

1. **Используйте декораторы** - для автоматического преобразования
2. **Документируйте модели** - объясняйте сложную логику
3. **Тестируйте преобразования** - unit тесты для моделей
4. **Обрабатывайте ошибки** - catchError в pipe
5. **Кэшируйте данные** - shareReplay для часто запрашиваемых
6. **Следуйте конвенциям** - четкие имена и структура
7. **Используйте типизацию** - строгая типизация везде
8. **Проверяйте null** - безопасная обработка значений
9. **Организуйте код** - логическая структура проекта
10. **Оптимизируйте импорты** - только необходимые модули
