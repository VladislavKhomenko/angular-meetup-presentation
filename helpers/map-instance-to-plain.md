# mapInstanceToPlain Helper

## Описание

`mapInstanceToPlain` - это вспомогательная функция для преобразования экземпляров классов в plain objects для отправки на бэкенд. Использует `class-transformer` для применения декораторов `@Expose`, `@Transform` и других.

## Исходный код

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

## Как работает

1. **Принимает класс и объект** - `SourceClass` и `sourceObject`
2. **Создает экземпляр** - `plainToInstance(SourceClass, sourceObject)`
3. **Применяет декораторы** - `@Expose`, `@Transform`, `@Exclude`
4. **Преобразует в plain object** - `instanceToPlain()`
5. **Возвращает результат** - `Record<string, unknown>`

## Проблема, которую решает

### Без mapInstanceToPlain

```typescript
// ❌ Проблема: как отправить User на бэкенд?
updateUser(user: User): Observable<User> {
  // user.avatar - это объект Avatar
  // но бэкенд ожидает avatarId: string
  return this.http.patch('/api/user', user); // ❌ Неправильно!
}

// ❌ Ручное преобразование
updateUser(user: User): Observable<User> {
  const payload = {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarId: user.avatar?.id || null, // Ручное преобразование
    createdAt: user.createdAt?.toISOString() // Ручное преобразование
  };
  return this.http.patch('/api/user', payload);
}
```

### С mapInstanceToPlain

```typescript
// ✅ Решение: автоматическое преобразование
updateUser(user: Partial<User>): Observable<User> {
  const transformedUser = mapInstanceToPlain(User, user);
  // transformedUser.avatarId = "123" вместо user.avatar = Avatar
  return this.http.patch('/api/user', transformedUser);
}
```

## Использование

### Базовый пример

```typescript
@Injectable()
export class UserApiService {
  @MapTo(User)
  updateUser(user: Partial<User>): Observable<User> {
    const transformedUser = mapInstanceToPlain(User, user);
    return this.http.patch('/api/user', transformedUser);
  }

  @MapTo(User)
  createUser(user: Partial<User>): Observable<User> {
    const transformedUser = mapInstanceToPlain(User, user);
    return this.http.post('/api/user', transformedUser);
  }
}
```

### Что происходит при преобразовании

```typescript
// Исходный объект User
const user = new User();
user.id = "123";
user.name = "John Doe";
user.email = "john@example.com";
user.avatar = new Avatar();
user.avatar.id = "456";
user.createdAt = new Date("2024-01-15T10:30:00Z");

// После mapInstanceToPlain(User, user)
const transformed = {
  id: "123",
  name: "John Doe", 
  email: "john@example.com",
  avatarId: "456",        // ← avatar.id преобразован в avatarId
  createdAt: "2024-01-15T10:30:00.000Z" // ← Date преобразован в ISO string
};
```

## Декораторы, которые применяются

### @Expose({ name: 'avatarId', toPlainOnly: true })

```typescript
export class User {
  @Expose({ name: 'avatarId', toPlainOnly: true })
  @Transform((params: TransformFnParams) => 
    (params.value ? toId(params.value) : null), 
    { toPlainOnly: true }
  )
  @Type(() => Avatar)
  avatar?: Nullable<Avatar>;
}
```

**Результат**: `user.avatar` → `transformed.avatarId`

### @Transform({ toPlainOnly: true })

```typescript
export class User {
  @Transform((params: TransformFnParams) => 
    params.value ? params.value.toISOString() : null,
    { toPlainOnly: true }
  )
  createdAt: Date;
}
```

**Результат**: `user.createdAt` (Date) → `transformed.createdAt` (string)

### @Exclude({ toPlainOnly: true })

```typescript
export class User {
  @Exclude({ toPlainOnly: true })
  internalField: string; // Не будет включен в результат
}
```

**Результат**: `internalField` исключен из `transformed`

## Примеры из проекта

### UsersApiService

```typescript
@Injectable({
  providedIn: 'root',
})
export class UsersApiService {
  readonly #apiService = inject(ApiService);

  @MapTo(User)
  updateUser(user: Partial<User>): Observable<User> {
    const transformedUser = mapInstanceToPlain(User, user);
    return this.#apiService.patch<User>(USERS_PROFILE_PATH, transformedUser);
  }
}
```

### Account модель

```typescript
export class Account {
  @Expose({ name: 'avatarId', toPlainOnly: true })
  @Transform((params: TransformFnParams) => 
    (params.value ? toId(params.value) : null), 
    { toPlainOnly: true }
  )
  @Type(() => MediaFileDetails)
  avatar: Nullable<MediaFileDetails | FileUpload>;

  @Expose({ name: 'cycleId', toPlainOnly: true })
  @Transform((params: TransformFnParams) => 
    (params.value ? toId(params.value) : null), 
    { toPlainOnly: true }
  )
  @Type(() => Cycle)
  cycle: Nullable<Cycle>;

  @Transform((params: TransformFnParams) => 
    (params.value ? params.value : undefined), 
    { toPlainOnly: true }
  )
  firstName = '';
}
```

### Преобразование Account

```typescript
// Исходный Account
const account = new Account();
account.id = "123";
account.firstName = "John";
account.lastName = "Doe";
account.avatar = mediaFile; // MediaFileDetails объект
account.cycle = cycle;      // Cycle объект

// После mapInstanceToPlain(Account, account)
const transformed = {
  id: "123",
  firstName: "John",
  lastName: "Doe",
  avatarId: "456",    // ← account.avatar.id
  cycleId: "789",     // ← account.cycle.id
  // lastName не включен, если пустой (из-за @Transform)
};
```

## Преимущества

- ✅ **Автоматическое преобразование** - использует декораторы модели
- ✅ **Консистентность** - одинаковое преобразование везде
- ✅ **Type safety** - полная поддержка TypeScript
- ✅ **Гибкость** - настраивается через декораторы
- ✅ **Производительность** - эффективное преобразование

## Ограничения

- ❌ **Требует класс** - нужен класс с декораторами class-transformer
- ❌ **Только toPlainOnly** - не работает с toClassOnly декораторами
- ❌ **Неизменяемость** - не изменяет исходный объект

## Тестирование

### Unit тест

```typescript
describe('mapInstanceToPlain Helper', () => {
  it('should transform User instance to plain object', () => {
    const user = new User();
    user.id = '123';
    user.name = 'John Doe';
    user.email = 'john@example.com';
    user.avatar = new Avatar();
    user.avatar.id = '456';
    user.createdAt = new Date('2024-01-15T10:30:00Z');

    const result = mapInstanceToPlain(User, user);

    expect(result).toEqual({
      id: '123',
      name: 'John Doe',
      email: 'john@example.com',
      avatarId: '456',        // ← avatar.id преобразован
      createdAt: '2024-01-15T10:30:00.000Z' // ← Date преобразован
    });
  });

  it('should handle null values correctly', () => {
    const user = new User();
    user.id = '123';
    user.avatar = null;

    const result = mapInstanceToPlain(User, user);

    expect(result.avatarId).toBeNull();
  });
});
```

## Лучшие практики

1. **Используйте с моделями** - только с классами, имеющими декораторы
2. **Документируйте декораторы** - объясняйте логику преобразования
3. **Тестируйте преобразования** - unit тесты для сложных случаев
4. **Обрабатывайте null** - проверяйте на null/undefined значения
5. **Используйте типизацию** - `Record<string, unknown>` для результата

## Альтернативы

### Ручное преобразование

```typescript
// ❌ Не рекомендуется
const manualTransform = (user: User) => ({
  id: user.id,
  name: user.name,
  avatarId: user.avatar?.id || null
});
```

### instanceToPlain напрямую

```typescript
// ✅ Альтернатива
const directTransform = (user: User) => instanceToPlain(user);
```

### Кастомные функции

```typescript
// ✅ Для специфических случаев
const customTransform = (user: User) => {
  const plain = mapInstanceToPlain(User, user);
  // Дополнительная логика
  return plain;
};
```

## Производительность

### Метрики (примерные)

- **Простой объект**: ~0.1ms
- **Сложный объект (10 полей)**: ~0.5ms
- **Память**: минимальное влияние
- **TypeScript**: полная поддержка

### Оптимизации

```typescript
// ✅ Кэширование для часто используемых объектов
const userCache = new Map<string, Record<string, unknown>>();

const getCachedTransform = (user: User) => {
  if (!userCache.has(user.id)) {
    userCache.set(user.id, mapInstanceToPlain(User, user));
  }
  return userCache.get(user.id);
};
```

## Связанные функции

- **plainToInstance** - обратное преобразование (plain → instance)
- **instanceToPlain** - прямое преобразование (instance → plain)
- **MapTo** - декоратор для автоматического преобразования
- **MapListTo** - декоратор для массивов
