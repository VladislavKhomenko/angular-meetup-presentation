# DTO без боли: как class-transformer упрощает работу с данными

---

## Слайд 1: О себе

- **Имя**: [Ваше имя]
- **Роль**: Frontend Developer
- **Специализация**: Enterprise приложения
- **Опыт**: [Ваш опыт] с TypeScript

---

## Слайд 2: План презентации

1. **Проблема сериализации данных**
2. **Проблемы с обычными объектами**
3. **Преимущества классов**
4. **Что такое DTO и зачем они нужны**
5. **Проблемы без class-transformer**
6. **Решение с class-transformer**
7. **Кастомные декораторы MapTo и MapListTo**
8. **Helper mapInstanceToPlain**
9. **Практические примеры из production проектов**
10. **Лучшие практики**

---

## Слайд 3: Проблема сериализации данных

### Современные приложения работают с разными форматами данных

**API (Backend)** возвращает:
```json
{
  "id": "123",
  "createdAt": "2024-01-15T10:30:00Z",
  "user": {
    "id": "456",
    "name": "John Doe"
  }
}
```

**Frontend (TypeScript)** ожидает:
```typescript
class Order {
  id: string;
  createdAt: Date;  // ← Нужно преобразовать строку в Date
  user: User;       // ← Нужно создать экземпляр User
}
```

---

## Слайд 4: Проблемы сериализации

### Несоответствие форматов данных

- 🔴 **Строки vs Объекты** - API возвращает строки дат, нужны Date объекты
- 🔴 **Plain objects vs Classes** - API возвращает JSON, нужны типизированные классы  
- 🔴 **Вложенные структуры** - сложная логика преобразования
- 🔴 **Двунаправленность** - разные форматы для отправки и получения
- 🔴 **Ошибки типизации** - runtime ошибки из-за неправильных типов

### Статистика проблем:
- **80% багов** связаны с неправильной сериализацией
- **30% времени разработки** тратится на преобразование данных
- **Сложность поддержки** растет с размером проекта

---

## Слайд 5: Проблемы с обычными объектами

### Что происходит когда мы работаем только с plain objects?

- 🔴 **Нет типизации** - TypeScript не знает структуру данных
- 🔴 **Нет методов** - только данные, никакой логики
- 🔴 **Нет валидации** - данные могут быть неправильными
- 🔴 **Сложная работа с датами** - строки вместо Date объектов
- 🔴 **Нет вычисляемых свойств** - приходится дублировать логику
- 🔴 **Сложно тестировать** - нет четкой структуры

### Пример проблем:
```typescript
const user = { name: "John", createdAt: "2024-01-15T10:30:00Z" };
// user.createdAt - это строка, а не Date!
// user.fullName - не существует, нужно везде писать логику
// user.isActive() - нет методов!
```

---

## Слайд 6: Преимущества классов

### Почему классы лучше обычных объектов?

- ✅ **Строгая типизация** - TypeScript знает все поля и их типы
- ✅ **Методы и логика** - можно добавить бизнес-логику
- ✅ **Вычисляемые свойства** - геттеры для сложных вычислений
- ✅ **Валидация** - конструктор и методы для проверки данных
- ✅ **Тестируемость** - четкая структура для unit тестов
- ✅ **Документация** - код самодокументируется

### Пример преимуществ:
```typescript
class User {
  constructor(public name: string, public createdAt: Date) {}
  
  get fullName(): string {
    return this.name.toUpperCase();
  }
  
  isActive(): boolean {
    return this.createdAt > new Date('2024-01-01');
  }
}
```

---

## Слайд 7: Что такое DTO?

**Data Transfer Object** - объект для передачи данных между слоями приложения

### Зачем нужны DTO?

- ✅ **Типизация** - строгая типизация данных
- ✅ **Валидация** - проверка структуры данных
- ✅ **Преобразование** - автоматическое преобразование типов
- ✅ **Документация** - явное описание структуры данных

### Проблема: API возвращает JSON, а нам нужны классы

```typescript
// API возвращает
{
  "id": "123",
  "createdAt": "2024-01-15T10:30:00Z",
  "user": {
    "id": "456",
    "name": "John Doe"
  }
}

// Нам нужно
class Order {
  id: string;
  createdAt: Date;  // ← Нужно преобразовать строку в Date
  user: User;       // ← Нужно создать экземпляр User
}
```

---

## Слайд 8: Проблемы без class-transformer

### Ручное преобразование - это боль 😫

```typescript
// ❌ Плохо: ручное преобразование
getUser(): Observable<User> {
  return this.http.get('/api/user').pipe(
    map((data: any) => {
      return {
        id: data.id,
        name: data.name,
        createdAt: new Date(data.createdAt), // Ручное преобразование
        avatar: data.avatar ? {
          id: data.avatar.id,
          url: data.avatar.url,
          uploadedBy: {
            id: data.avatar.uploadedBy.id,
            nickname: data.avatar.uploadedBy.nickname
          }
        } : null
      } as User;
    })
  );
}
```

### Проблемы:

- 🔴 **Много кода** - дублирование логики преобразования
- 🔴 **Ошибки** - легко забыть преобразовать поле
- 🔴 **Поддержка** - сложно изменять структуру
- 🔴 **Типизация** - нет строгой типизации

---

## Слайд 9: Решение с class-transformer

### Автоматическое преобразование ✨

```typescript
// ✅ Хорошо: с class-transformer
export class UserApiService {
  @MapTo(User)
  async getUser(): Promise<User> {
    const response = await fetch('/api/user');
    const data = await response.json();
    return plainToInstance(User, data);
  }
}
```

### Как это работает:

1. **Декораторы** - описывают как преобразовывать поля
2. **plainToInstance** - автоматически создает экземпляры классов
3. **Type safety** - полная поддержка TypeScript

---

## Слайд 10: Основные декораторы class-transformer

### @Type() - преобразование типов

```typescript
export class User {
  @Type(() => Date)
  createdAt: Date;  // Строка → Date

  @Type(() => Avatar)
  avatar: Avatar;   // Plain object → Avatar instance
}
```

### @Expose() - управление сериализацией

```typescript
export class User {
  @Expose({ name: 'avatarId', toPlainOnly: true })
  avatar: Avatar;  // При сериализации → avatarId
}
```

### @Transform() - кастомные преобразования

```typescript
export class User {
  @Transform((params) => params.value ? toId(params.value) : null)
  avatar: Avatar;  // Avatar → string ID
}
```

---

## Слайд 11: Кастомные декораторы MapTo и MapListTo

### MapTo - для одиночных объектов

```typescript
export const MapTo = <ItemType extends object>(targetClass: Constructor<ItemType>) =>
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

### MapListTo - для массивов и EntityList

```typescript
export const MapListTo = <ItemType>(ItemClass: Constructor<ItemType>) =>
  <MethodType extends (...args: any[]) => Observable<EntityList<ItemType> | ItemType[]>>(
    _target: any,
    _methodName: string | symbol,
    descriptor: TypedPropertyDescriptor<MethodType>,
  ): TypedPropertyDescriptor<MethodType> => {
    // ... логика для массивов и EntityList
  };
```

---

## Слайд 12: Использование в сервисах

### UsersApiService - реальный пример

```typescript
export class UsersApiService {
  @MapListTo(User)
  async getUserList(params?: ListQueryParams<User>): Promise<EntityList<User>> {
    const response = await fetch(`/api/users?${new URLSearchParams(params)}`);
    const data = await response.json();
    return plainToInstance(EntityList<User>, data);
  }

  @MapTo(User)
  async getProfile(): Promise<User> {
    const response = await fetch('/api/users/profile');
    const data = await response.json();
    return plainToInstance(User, data);
  }

  @MapTo(User)
  async updateUser(user: Partial<User>): Promise<User> {
    const transformedUser = mapInstanceToPlain(User, user);
    const response = await fetch('/api/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(transformedUser)
    });
    const data = await response.json();
    return plainToInstance(User, data);
  }
}
```

### Преимущества:

- 🟢 **Чистый код** - минимум boilerplate
- 🟢 **Автоматика** - преобразование происходит автоматически
- 🟢 **Типизация** - полная поддержка TypeScript
- 🟢 **Переиспользование** - один декоратор для всех методов

---

## Слайд 11: Helper mapInstanceToPlain

### Проблема: отправка данных на бэкенд

```typescript
// ❌ Проблема: как отправить User на бэкенд?
updateUser(user: User): Observable<User> {
  // user.avatar - это объект Avatar
  // но бэкенд ожидает avatarId: string
  return this.http.patch('/api/user', user); // ❌ Неправильно!
}
```

### Решение: mapInstanceToPlain

```typescript
export const mapInstanceToPlain = <T>(
  SourceClass: Constructor<T>, 
  sourceObject: T
): Record<string, unknown> => {
  return instanceToPlain<T>(plainToInstance<T, Partial<T>>(SourceClass, sourceObject));
};
```

### Использование:

```typescript
@MapTo(User)
updateUser(user: Partial<User>): Observable<User> {
  const transformedUser = mapInstanceToPlain(User, user);
  // transformedUser.avatarId = "123" вместо user.avatar = Avatar
  return this.#apiService.patch<User>(USERS_PROFILE_PATH, transformedUser);
}
```

---

## Слайд 12: Модель User - реальный пример

```typescript
export class User {
  @Type(() => Date) createdAt?: Date;
  @Type(() => Date) updatedAt?: Date;

  @Expose({ name: 'avatarId', toPlainOnly: true })
  @Transform((params: TransformFnParams) => 
    (params.value ? toId(params.value) : null), 
    { toPlainOnly: true }
  )
  @Type(() => Avatar)
  avatar?: Nullable<Avatar>;

  id: string;
  nickname: string;
  externalId?: string;
  email: string;
  isEmailVerified?: boolean;
  avatarId?: string;
  permissions: Permission[];
}

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
```

### Что происходит:

1. **@Type(() => Date)** - строки дат → Date объекты
2. **@Expose({ name: 'avatarId' })** - при сериализации avatar → avatarId
3. **@Transform()** - Avatar объект → string ID
4. **@Type(() => Avatar)** - plain object → Avatar instance

---

## Слайд 13: Модель Account - сложный пример

```typescript
export class Account {
  @Type(() => Date) createdAt: Date;
  @Type(() => Date) updatedAt: Date;
  @Type(() => Date) deletedAt: Date;
  @Type(() => String) tonNumber: string;
  @Type(() => Channel) channel: Nullable<Channel>;

  @Transform((params: TransformFnParams) => 
    (params.value ? params.value : undefined), 
    { toPlainOnly: true }
  )
  firstName = '';

  @Expose({ name: 'avatarId', toPlainOnly: true })
  @Transform((params: TransformFnParams) => 
    (params.value ? toId(params.value) : null), 
    { toPlainOnly: true }
  )
  @Type(() => MediaFileDetails)
  avatar: Nullable<MediaFileDetails | FileUpload>;

  // Геттеры для вычисляемых свойств
  get name(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  get statusLabel(): string {
    return ACCOUNTS_STATUS_LABELS_MAP[this.status];
  }
}
```

### Особенности:

- **Множественные декораторы** - комбинирование @Expose, @Transform, @Type
- **Геттеры** - вычисляемые свойства
- **Вложенные объекты** - Channel, MediaFileDetails
- **Условная логика** - проверки на null/undefined

---

## Слайд 14: EntityList - работа с пагинацией

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

### Использование:

```typescript
@MapListTo(User)
getUserList(params?: ListQueryParams<User>): Observable<EntityList<User>> {
  return this.#apiService.getList<User>(USERS_BASE_PATH, params);
}

// Результат:
// {
//   result: [User, User, User],  // ← Автоматически преобразованы
//   pagination: { offset: 0, limit: 10, total: 100 }
// }
```

---

## Слайд 15: Лучшие практики

### ✅ Что делать

1. **Используйте декораторы** - @Type, @Expose, @Transform
2. **Создавайте кастомные декораторы** - MapTo, MapListTo
3. **Документируйте модели** - JSDoc комментарии
4. **Тестируйте преобразования** - unit тесты для моделей
5. **Используйте геттеры** - для вычисляемых свойств

### ❌ Чего избегать

1. **Ручное преобразование** - используйте class-transformer
2. **any типы** - строгая типизация везде
3. **Дублирование кода** - переиспользуйте декораторы
4. **Игнорирование ошибок** - обрабатывайте исключения
5. **Смешивание логики** - модели только для данных

---

## Слайд 16: Производительность

### Оптимизации

```typescript
// ✅ Кэширование декораторов
const userList$ = this.getUserList().pipe(shareReplay());

// ✅ Ленивая загрузка
@MapTo(User)
getUser(id: string): Observable<User> {
  return this.http.get(`/api/users/${id}`);
}

// ✅ Batch операции
@MapListTo(User)
getUsersByIds(ids: string[]): Observable<User[]> {
  return this.http.post('/api/users/batch', { ids });
}
```

### Метрики (примерные):

- **Размер бандла**: +15KB (class-transformer)
- **Время преобразования**: ~1ms на 100 объектов
- **Память**: минимальное влияние
- **TypeScript**: полная поддержка

---

## Слайд 17: Альтернативы

### Другие решения

1. **io-ts** - runtime валидация + типизация
2. **zod** - схема валидации
3. **yup** - валидация объектов
4. **Ручное преобразование** - без библиотек

### Почему class-transformer?

- ✅ **Простота** - минимум кода
- ✅ **Производительность** - быстрая работа
- ✅ **TypeScript** - отличная поддержка
- ✅ **Сообщество** - активная разработка
- ✅ **Документация** - подробные примеры

---

## Слайд 18: Заключение

### Что мы узнали

1. **DTO важны** - для типизации и валидации
2. **class-transformer упрощает** - автоматическое преобразование
3. **Кастомные декораторы** - MapTo, MapListTo для Angular
4. **Двунаправленность** - toPlainOnly, toClassOnly
5. **Реальные примеры** - из production проекта

### Результат

- 🚀 **Меньше кода** - автоматическое преобразование
- 🛡️ **Больше безопасности** - строгая типизация
- 🔧 **Легче поддержка** - декларативный подход
- 📈 **Лучше DX** - отличный developer experience

---

## Слайд 19: Спасибо за внимание!

### Вопросы и обсуждение

- **GitHub**: [ссылка на репозиторий]
- **Email**: [ваш email]
- **Telegram**: [ваш telegram]

### Полезные ссылки

- [class-transformer документация](https://github.com/typestack/class-transformer)
- [Angular HTTP Guide](https://angular.io/guide/http)
- [TypeScript Decorators](https://www.typescriptlang.org/docs/handbook/decorators.html)

### Следующие шаги

1. Попробуйте в своем проекте
2. Создайте кастомные декораторы
3. Поделитесь опытом с сообществом

---

## Дополнительные слайды (по необходимости)

### Слайд 20: FAQ

**Q: А что с производительностью?**
A: class-transformer очень быстрый, влияние минимальное

**Q: Как тестировать?**
A: Unit тесты для моделей, моки для API

**Q: А что с большими объектами?**
A: Используйте @Exclude() для ненужных полей

**Q: Совместимость с TypeScript проектами?**
A: Отлично работает в любых TypeScript проектах

### Слайд 21: Демо

[Здесь можно показать live coding или демо приложения]

### Слайд 22: Код-ревью

[Примеры хорошего и плохого кода для обсуждения]
