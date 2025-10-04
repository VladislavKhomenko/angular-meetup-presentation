---
theme: seriph
background: https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80
title: DTO без боли
info: |
  ## DTO без боли: как class-transformer упрощает жизнь в Angular
  
  Презентация для Angular meetup о том, как использовать class-transformer для работы с DTO в Angular приложениях.
  
  Показываем реальные примеры из production проектов.
class: text-center
drawings:
  persist: false
transition: slide-left
mdc: true
seoMeta:
  ogImage: auto
---

<style>
/* Глобальные стили для лучшего отображения */
.slidev-layout {
  font-size: 0.9rem;
}

.slidev-layout h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.slidev-layout h2 {
  font-size: 1.8rem;
  margin-bottom: 0.8rem;
}

.slidev-layout h3 {
  font-size: 1.4rem;
  margin-bottom: 0.6rem;
}

.slidev-layout pre {
  font-size: 0.8rem;
  line-height: 1.4;
}

.slidev-layout .grid {
  gap: 1rem;
}

.slidev-layout .mt-4 {
  margin-top: 0.5rem;
}

.slidev-layout .mt-8 {
  margin-top: 1rem;
}

.slidev-layout .p-3 {
  padding: 0.5rem;
}

.slidev-layout .p-4 {
  padding: 0.75rem;
}

.slidev-layout .text-sm {
  font-size: 0.8rem;
}
</style>

# DTO без боли

## как class-transformer упрощает жизнь в Angular

<!-- <div class="pt-12">
  <span @click="$slidev.nav.next" class="px-2 py-1 rounded cursor-pointer" hover:bg="white hover:bg-opacity-10">
    Погнали! <carbon:arrow-right class="inline"/>
  </span>
</div> -->

<div class="abs-br m-6 flex gap-2">
  <button @click="$slidev.nav.openInEditor()" title="Open in Editor" class="text-xl slidev-icon-btn opacity-50 !border-none !hover:text-white">
    <carbon:edit />
  </button>
  <a href="https://github.com/typestack/class-transformer" target="_blank" alt="GitHub" class="text-xl slidev-icon-btn opacity-50 !border-none !hover:text-white">
    <carbon:logo-github />
  </a>
</div>

<!--
Привет! Меня зовут [Ваше имя], я Frontend Developer.

Сегодня я расскажу о том, как class-transformer может кардинально упростить работу с DTO в Angular приложениях.
-->

---
transition: fade-out
---

# О себе

<div class="grid grid-cols-2 gap-8 pt-4 -mb-6">

<div>

## 👨‍💻 Кто я
- **Frontend Architect**
- **Опыт**: 10 лет с Angular

</div>

<div>

## 🎯 О чем поговорим
- Что такое DTO и зачем нужны
- Проблемы без class-transformer
- Решение с class-transformer
- Кастомные декораторы
- Реальные примеры из проекта

</div>

</div>

<!--
Расскажите немного о себе и своем опыте работы с Angular.
Объясните, что это реальный production опыт, где мы активно используем class-transformer.
-->


---
transition: fade-out
---

# Что такое DTO?

**Data Transfer Object** - объект для передачи данных между слоями приложения


## Зачем нужны DTO?

- ✅ **Типизация** - строгая типизация данных
- ✅ **Валидация** - проверка структуры данных  
- ✅ **Преобразование** - автоматическое преобразование типов
- ✅ **Документация** - явное описание структуры данных


---
transition: slide-up
level: 2
---

# API возвращает JSON, а нам нужны классы

## 1. Данные с API (plain object)

<div class="grid grid-cols-2 gap-8 pt-4 -mb-6">

<div>

```typescript
{
  "id": "123",
  "nickname": "john_doe",
  "email": "john@example.com",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  "avatar": {
    "id": "456",
    "filePath": "/uploads/avatar.jpg",
    "originalFilename": "my avatar",
    "metadata": {
      "size": 1024000,
      "mimeType": "image/jpeg",
      "uploadedAt": "2024-01-15T10:30:00Z",
      "checksum": "abc123def456"
    }
  }
}
```

</div>

<div>
```typescript
// Что хотим получить
  class User {
    id: string;
    ...
    createdAt: Date;  // ← Нужно преобразовать в Date
    Avatar: User;     // ← Нужно создать экземпляр User
  }
```

</div>

</div>

<!--
Объясните, что DTO - это не просто интерфейсы, а полноценные классы с методами и преобразованиями.
Покажите, что основная проблема - это несоответствие между тем, что приходит с API (JSON) и тем, что нужно в приложении (типизированные объекты).
-->

---
transition: slide-up
level: 2
---

# Проблемы 

## Ручное преобразование - это боль 😫

```typescript {all|4-13|14-16}
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
          filePath: data.avatar.filePath,
          // ... много дублированного кода
        } : null
      } as User;
    })
  );
}
```

---
transition: slide-right
level: 2
---

# Проблемы 

<div class="mt-4 p-3 bg-red-100 rounded-lg text-sm">

- 🔴 **Много кода** - дублирование логики
- 🔴 **Ошибки** - легко забыть преобразовать поле
- 🔴 **Поддержка** - сложно изменять структуру
- 🔴 **Типизация** - нет строгой типизации
- 🔴 **Читаемость** - много boilerplate кода
- 🔴 **Тестирование** - сложно тестировать преобразования

</div>

<div v-click class="mt-4 p-3 bg-yellow-100 rounded-lg text-sm">

## Статистика:
- **150+ строк кода** для простого CRUD
- **Дублирование логики** в каждом методе
- **Высокий риск ошибок** при изменениях

</div>

<!--
Покажите реальный пример ручного преобразования. Обратите внимание на количество кода и сложность.
Подчеркните, что такая логика дублируется в каждом методе API сервиса.
-->

---
transition: slide-up
level: 2
---

# Решение с class-transformer

## Автоматическое преобразование ✨

```typescript {all|4-4|4-7}
// ✅ Хорошо: с class-transformer
@Injectable()
export class UserApiService {
  @MapTo(User)
  getUser(): Observable<User> {
    return this.http.get('/api/user');
  }
}
```

<!-- <div v-click class="mt-8">

## Как это работает:

1. **MapTo** - автоматически создает экземпляры классов
2. **Type safety** - полная поддержка TypeScript

</div> -->

---
transition: slide-up
level: 2
---


<img src="https://sticker-collection.com/stickers/plain/Dichset/512/aec2c11d-826c-430b-8623-56cc72400a01file_3836920.webp" alt="class-transformer magic" style="margin: 24px auto; display: block;" />


---
transition: slide-up
level: 2
---

# Основные декораторы class-transformer

<div class="grid grid-cols-2 gap-6">

<div>

### @Type() - преобразование типов

```typescript
export class User {
  @Type(() => Date)
  createdAt: Date;  // Строка → Date

  @Type(() => Avatar)
  avatar: Avatar;   // Plain object → Avatar
}
```

### @Expose() - управление сериализацией

```typescript
export class User {
  @Expose({ name: 'avatarId', toPlainOnly: true })
  avatar: Avatar;  // При сериализации → avatarId
}
```

</div>

<div>

### @Transform() - преобразования

```typescript
export class User {
  @Transform((params) => 
    params.value ? toId(params.value) : null, { toPlainOnly: true })
  avatar: Avatar;  // Avatar → string ID

  internalField: string;
}
```

### @Exclude() - исключение полей

```typescript
export class User {
  @Exclude({ toPlainOnly: true })
  internalField: string; // Не отправляется на бэкенд
}
```

</div>

</div>

<!--
Покажите основные декораторы с примерами. Объясните, что каждый декоратор решает свою задачу.
Подчеркните, что декораторы можно комбинировать для сложных преобразований.
-->

---
transition: slide-up
level: 2
---

# Кастомные декораторы MapTo и MapListTo

## MapTo - для одиночных объектов

```typescript {all|1-6|8-9|10-14|15-16}
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

<!-- <div class="mt-4 p-3 bg-blue-100 rounded-lg text-sm">

## Как работает MapTo:
1. **Принимает класс** - targetClass для преобразования
2. **Перехватывает метод** - оригинальный вызов
3. **Применяет преобразование** - plainToInstance
4. **Возвращает Observable** - с преобразованным объектом

</div> -->

---
transition: slide-right
level: 2
---

# MapListTo - для массивов и EntityList

```typescript {all|1-6|7-8|10-18|19-21}
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
          return plainToInstance(ItemClass, data);
        }
        return plainToClassFromExist(new EntityList<ItemType>(ItemClass), data);
      };
      return originalMethod?.apply(this, args).pipe(map(toList));
    } as MethodType;

    return descriptor;
  };
```

<!-- <div v-click class="mt-4 p-3 bg-green-100 rounded-lg text-sm">

## Как работает MapListTo:
1. **Проверяет тип данных** - массив или EntityList
2. **Перехватывает метод** - оригинальный вызов
3. **Применяет преобразование** - plainToInstance или plainToClassFromExist
4. **Сохраняет пагинацию** - для EntityList
5. **Возвращает Observable** - с преобразованными объектами

</div> -->

---
transition: slide-up
level: 2
---

# Использование в сервисах

## UsersApiService - реальный пример

```typescript {all|5-9|10-14|15-22}
@Injectable({ providedIn: 'root' })
export class UsersApiService {
  readonly #apiService = inject(ApiService);

  @MapListTo(User)
  getUserList(params?: ListQueryParams<User>): Observable<EntityList<User>> {
    return this.#apiService.getList<User>(USERS_BASE_PATH, params);
  }

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

<!-- <div v-click class="mt-4 p-3 bg-green-100 rounded-lg text-sm">

## Как работает MapListTo:
1. **Преобразование листа** - Преобразует лист который нам пришел к листу User
2. **Преобразование пользователя** - Преобразует JSON который нам пришел к инстансу User
3. **Преобразование пользователя после обновления**

</div> -->


---
transition: slide-right
level: 2
---

# Преимущества использования декораторов

<div class="p-3 bg-green-100 rounded-lg text-sm">

- 🟢 **Чистый код** - минимум boilerplate
- 🟢 **Автоматика** - преобразование происходит автоматически
- 🟢 **Типизация** - полная поддержка TypeScript
- 🟢 **Переиспользование** - один декоратор для всех методов
- 🟢 **Читаемость** - декларативный подход
- 🟢 **Тестирование** - легко тестировать сервис

</div>

<div v-click class="mt-4 p-3 bg-blue-100 rounded-lg text-sm">

- **Без декораторов**: 150+ строк кода для CRUD
- **С декораторами**: 20 строк кода для того же функционала

</div>

<!--
Покажите реальный пример из production проекта. Обратите внимание на чистоту кода и отсутствие дублирования.
Подчеркните, что вся сложная логика преобразования скрыта в декораторах.
-->

---
transition: slide-up
level: 2
---

# Helper mapInstanceToPlain

## Проблема: отправка данных на бэкенд

```typescript {all|2-6|10-16}
// ❌ Проблема: как отправить User на бэкенд?
updateUser(user: Partial<User>): Observable<User> {
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

<!-- <div v-click class="mt-4 p-3 bg-red-100 rounded-lg text-sm">

## Проблема:
- 🔴 **Дублирование кода** - одинаковая логика в каждом методе
- 🔴 **Ошибки** - легко забыть преобразовать поле
- 🔴 **Поддержка** - сложно изменять структуру

</div> -->

---
transition: slide-right
level: 2
---

# Решение: mapInstanceToPlain

```typescript {all|2-3|5-5}
export const mapInstanceToPlain = <T>(
  SourceClass: Constructor<T>, 
  sourceObject: T
): Record<string, unknown> => {
  return instanceToPlain<T>(plainToInstance<T, Partial<T>>(SourceClass, sourceObject));
};
```

<div v-click class="mt-4 p-3 bg-blue-100 rounded-lg text-sm">

## Использование:
```typescript
@MapTo(User)
updateUser(user: Partial<User>): Observable<User> {
  const transformedUser = mapInstanceToPlain(User, user);
  return this.#apiService.patch<User>('/api/users/profile', transformedUser);
}
```

</div>

<!-- <div class="mt-4 p-3 bg-green-100 rounded-lg text-sm">

## Как работает:
1. **Принимает класс и объект** - SourceClass и sourceObject
2. **Создает экземпляр** - plainToInstance(SourceClass, sourceObject)
3. **Применяет декораторы** - @Expose, @Transform, @Exclude
4. **Преобразует в plain object** - instanceToPlain()
5. **Возвращает результат** - Record<string, unknown>

</div> -->

---
transition: slide-up
level: 2
---

# Модель User - реальный пример

```typescript {all|2-4|5-8|14-17}
export class User {
  @Type(() => Date) createdAt?: Date;
  @Type(() => Date) updatedAt?: Date;

  @Expose({ name: 'avatarId', toPlainOnly: true })
  @Transform(paramsToId, { toPlainOnly: true })
  @Type(() => Avatar)
  avatar?: Nullable<Avatar>;

  id: string;
  nickname: string;
  email: string;
  permissions: Permission[];

  get fullName(): string {
    return `${this.nickname} (${this.email})`;
  }
}
```

<!-- <div v-click class="mt-4 p-3 bg-blue-100 rounded-lg text-sm">

## Ключевые особенности:
- **@Type(() => Date)** - автоматическое преобразование дат
- **@Expose + @Transform** - при сериализации avatar → avatarId
- **@Transform()** - Avatar объект → string ID
- **Геттеры** - вычисляемые свойства

</div> -->

---
transition: slide-right
level: 2
---

# Модель Avatar - вложенный класс

```typescript {all|1-7|10-11|20-22}
class FileMetadata {
  @Type(() => Date) uploadedAt?: Date;
  
  size: number;
  mimeType: string;
  checksum: string;
}

class Avatar {
  @Type(() => FileMetadata) metadata?: FileMetadata;

  id: string;
  filePath: string;
  name: string;
  mime: string;
  originalFilename: string;
  checksum: string;
  privacyPolicy: string;

  get customFilePath(): string {
    return `${this.filePath}:${this.originalFilename}`;
  }
}
```

<!-- <div v-click class="mt-4 p-3 bg-blue-100 rounded-lg text-sm">

## Что приходит с API:
- **Строки дат** - "2024-01-15T10:30:00Z"
- **JSON структура** - без типизации

</div> -->

---
transition: slide-right
level: 2
---

# Преобразование данных 

## 2. После @MapTo(User)
```typescript
@MapTo(User)
// user.createdAt - это Date объект
// user.avatar - это экземпляр Avatar
// user.avatar.metadata - это экземпляр FileMetadata
// user.avatar.metadata.createdAt - это Date объект

```

## 3. При отправке на бэкенд
```typescript
const payload = mapInstanceToPlain(User, user);
// payload.avatarId = "456" (вместо payload.avatar = Avatar)
// payload.createdAt = "2024-01-15T10:30:00.000Z" (ISO строка)
```

<!-- <div v-click class="mt-4 p-3 bg-green-100 rounded-lg text-sm">

## Результат преобразования:
- **Date объекты** - автоматическое преобразование строк
- **Экземпляры классов** - с методами и геттерами
- **Типизация** - полная поддержка TypeScript
- **Двунаправленность** - toPlainOnly, toClassOnly

</div> -->

---
transition: slide-up
level: 2
---

# 🚀 Результат


- **В 7 раз меньше кода** в API сервисах
- **Строгая типизация** всех данных
- **Простая поддержка** и изменения
- **Отличный DX** для разработчиков

<div class="mt-8 p-4 bg-blue-100 rounded-lg">

## Пример сравнения:
- **Без class-transformer**: 150+ строк кода для CRUD
- **С class-transformer**: 20 строк кода для того же функционала

</div>

<!--
Покажите реальную статистику использования в production проекте.
Подчеркните, что это не теоретические примеры, а реальный опыт.
-->

---
transition: slide-up
level: 2
---

# Лучшие практики

<div class="grid grid-cols-2 gap-6">

<div>

## ✅ Что делать
1. **Используйте декораторы** - @Type, @Expose, @Transform
2. **Создавайте кастомные декораторы** - MapTo, MapListTo
3. **Документируйте модели** - JSDoc комментарии
4. **Тестируйте преобразования** - unit тесты для моделей
5. **Используйте геттеры** - для вычисляемых свойств

</div>

<div>

## ❌ Чего избегать
1. **Ручное преобразование** - используйте class-transformer
2. **any типы** - строгая типизация везде
3. **Дублирование кода** - переиспользуйте декораторы
4. **Игнорирование ошибок** - обрабатывайте исключения
5. **Смешивание логики** - модели только для данных

</div>

</div>

<!--
Дайте практические рекомендации по использованию class-transformer.
Основано на реальном production опыте.
-->


<!-- # Производительность

<div class="mt-4 p-3 bg-yellow-100 rounded-lg text-sm">

## Метрики (примерные):
- **Размер бандла**: +15KB (class-transformer)
- **Время преобразования**: ~1ms на 100 объектов
- **Память**: минимальное влияние
- **TypeScript**: полная поддержка

</div> -->

<!--
Покажите, что class-transformer не влияет на производительность приложения.
Дайте конкретные цифры и рекомендации по оптимизации.
-->

---
transition: slide-up
level: 2
---

# Альтернативы

<div class="grid grid-cols-2 gap-6">

<div>

## Другие решения
1. **io-ts** - runtime валидация + типизация
2. **zod** - схема валидации
3. **yup** - валидация объектов
4. **Ручное преобразование** - без библиотек

</div>

<div>

## Почему class-transformer?
- ✅ **Простота** - минимум кода
- ✅ **Производительность** - быстрая работа
- ✅ **TypeScript** - отличная поддержка
- ✅ **Сообщество** - активная разработка
- ✅ **Документация** - подробные примеры

</div>

</div>

<!--
Покажите альтернативы и объясните, почему выбрали именно class-transformer.
Основано на реальном сравнении в production проектах.
-->

---
transition: slide-up
level: 2
---

# Заключение

## Что мы узнали

1. **DTO важны** - для типизации и валидации
2. **class-transformer упрощает** - автоматическое преобразование
3. **Кастомные декораторы** - MapTo, MapListTo
4. **Двунаправленность** - toPlainOnly, toClassOnly
5. **Реальные примеры** - из production проекта

<!-- <div v-click class="mt-4 p-3 bg-green-100 rounded-lg text-sm">

## Результат
- 🚀 **Меньше кода** - автоматическое преобразование
- 🛡️ **Больше безопасности** - строгая типизация
- 🔧 **Легче поддержка** - декларативный подход
- 📈 **Лучше DX** - отличный developer experience

</div> -->

<!--
Подведите итоги презентации. Подчеркните ключевые преимущества class-transformer.
Дайте аудитории четкое понимание, зачем это нужно и как это поможет в их проектах.
-->

---
layout: center
class: text-center
---

# Спасибо за внимание!

## Вопросы и обсуждение

<!-- <div class="pt-12">
  <div class="flex justify-center gap-4">
    <a href="https://github.com/typestack/class-transformer" target="_blank" class="text-xl slidev-icon-btn !border-none !hover:text-white">
      <carbon:logo-github />
    </a>
    <a href="https://sli.dev" target="_blank" class="text-xl slidev-icon-btn !border-none !hover:text-white">
      <carbon:logo-slack />
    </a>
  </div>
</div> -->

<div class="pt-8 text-sm opacity-50">
  <div>Полезные ссылки:</div>
  <div class="flex justify-center gap-4 mt-2">
    <a href="https://github.com/typestack/class-transformer" target="_blank">class-transformer</a>
    <a href="https://www.typescriptlang.org/docs/handbook/decorators.html" target="_blank">TypeScript Decorators</a>
  </div>
</div>

<!--
Завершите презентацию благодарностью и призывом к вопросам.
Дайте полезные ссылки для дальнейшего изучения.
-->


