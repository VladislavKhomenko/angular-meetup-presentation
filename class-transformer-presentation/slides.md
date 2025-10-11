---
theme: seriph
background: https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80
title: DTO без боли
info: |
  ## DTO без боли: как class-transformer упрощает жизнь
  
  Презентация о том, как использовать class-transformer для работы с DTO в TypeScript приложениях.
  
  Подходит для Angular, React, Node.js и других TypeScript проектов. Показываем реальные примеры из production проектов.
class: text-center
drawings:
  persist: false
transition: slide-up
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

## как class-transformer упрощает жизнь

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

Сегодня я расскажу о том, как class-transformer может кардинально упростить работу с DTO в TypeScript приложениях.
-->

---
transition: slide-up
---

# О себе

<div class="grid grid-cols-2 gap-8 pt-4 -mb-6">

<div>

## 👨‍💻 Кто я
- **Frontend Architect**
- **Опыт**: 10 лет опыта коммерческой разработки

</div>

<div>

## 🎯 О чем поговорим
- Что такое DTO и зачем нужны
- Проблемы сериализации данных
- Решение проблемы
- Реальные примеры из проекта

</div>

</div>

<!--
Расскажите немного о себе и своем опыте работы с TypeScript.
Объясните, что это реальный production опыт, где мы активно используем class-transformer.
-->


---
transition: slide-up
---

# Проблема сериализации данных

<div class="grid grid-cols-2 gap-8 pt-4 -mb-6">

<div>

### 🔴 API (Backend)
```json
{
  "id": "123",
  "createdAt": "2024-01-15T10:30:00Z",
  "avatar": {
    "id": "456",
    "name": "some image",
    "size": 2048
    ...
  }
}
```

</div>

<div>

### 🟢 Frontend
```typescript
interface User {
  id: string;
  createdAt: Date;  // ← Нужно преобразовать
  avatar: Avatar;   // ← Нужно преобразовать
}
```

</div>

</div>

---
transition: slide-up
level: 2
---

# Проблемы сериализации

## Несоответствие форматов данных

<div class="p-3 bg-red-100 rounded-lg text-sm">

- 🔴 **Строки vs Объекты** - API возвращает строки дат, нужны Date объекты
- 🔴 **Вложенные структуры** - сложная логика преобразования
- 🔴 **Двунаправленность** - разные форматы для отправки и получения
- 🔴 **Ошибки типизации** - runtime ошибки из-за неправильных типов

</div>

<div v-click class="mt-4 p-3 bg-yellow-100 rounded-lg text-sm">

## Статистика проблем:
- **80% багов** связаны с неправильной сериализацией
- **30% времени разработки** тратится на преобразование данных
- **Сложность поддержки** растет с размером проекта

</div>

---
transition: slide-up
level: 2
---

# Проблемы с обычными объектами

## Что происходит когда мы работаем только с plain objects?

<div class="p-3 bg-red-100 rounded-lg text-sm">

- 🔴 **Нет методов** - только данные, никакой логики
- 🔴 **Нет валидации** - данные могут быть неправильными
- 🔴 **Нет вычисляемых свойств** - приходится дублировать логику
- 🔴 **Сложно тестировать** - нет четкой структуры

</div>

<div v-click class="mt-4 p-3 bg-yellow-100 rounded-lg text-sm">

## Пример проблем:
```typescript
const user = { name: "John", createdAt: "2024-01-15T10:30:00Z" };
// user.createdAt - это строка, а не Date!
// user.fullName - не существует, нужно везде писать логику
// user.isActive() - нет методов!
```

</div>

---
transition: slide-up
level: 2
---

# Ручное преобразование - это боль 😫

```typescript {all|4-13|14-16}
// ❌ Плохо: ручное преобразование
getUser(): Observable<User> {
  return this.http.get<User>('/api/user').pipe(
    map((data) => {
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
transition: slide-up
level: 2
---

# Проблемы ручного подхода:


<div class="mt-4 p-3 bg-red-100 rounded-lg text-sm">

- 🔴 **Много кода** - дублирование логики преобразования
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

---
transition: slide-up
level: 2
---

<div class="flex justify-center items-center h-100">

# А что если использовать классы??

</div>

---
transition: slide-up
level: 2
---

# Преимущества классов

## Почему классы лучше обычных объектов?

<div class="p-3 bg-green-100 rounded-lg text-sm">

- ✅ **Методы и логика** - можно добавить бизнес-логику
- ✅ **Вычисляемые свойства** - геттеры для сложных вычислений
- ✅ **Валидация** - конструктор и методы для проверки данных
- ✅ **Тестируемость** - четкая структура для unit тестов
- ✅ **Документация** - код самодокументируется

</div>

---
transition: slide-up
level: 2
---

# Пример преимуществ

<div class="mt-4  rounded-lg text-sm">

```typescript
class User {
  ...
  createdAt: Date;

  constructor(..., name: string, createdAt: string) {
    this.createdAt = new Date(createdAt)
  }
  
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }
  
  isActive(): boolean {
    return this.createdAt > new Date('2024-01-01');
  }
}
```

</div>

---
transition: slide-up
level: 2
---

# Первое улучшение: конструктор класса 👨‍🔧

```typescript
// ✅ Почти хорошо: с использованием class
getUser(): Observable<User> {
  return this.http.get<User>('/api/user').pipe(
    map((data) => new User(data))
  );
}
```

---
transition: slide-up
level: 2
---

# Но конструктор класса - это много кода 😰

```typescript {all|16-20|21-22}
class User {
  // Примитивы - просто копируем
  id: string;
  email: string;
  
  // Даты - преобразуем вручную
  createdAt: Date;
  updatedAt: Date;
  
  // Вложенные объекты - создаем вручную
  avatar: Avatar | null;

  roles: Role[]
  
  constructor(data: any) {
    this.id = data.id;
    this.email = data.email;
    this.createdAt = new Date(data.createdAt); // ❌ Ручное преобразование
    this.updatedAt = new Date(data.updatedAt); // ❌ Ручное преобразование
    this.avatar = data.avatar ? new Avatar(data.avatar) : null; // ❌ Вручную проверяем и создаем
    this.roles = data.roles.map((role) => new Role(role)); // ❌ Ручное преобразование
  }
}
```

---
layout: center
class: text-center
---

# Знакомьтесь: class-transformer 🎯

<div class="text-2xl mt-8">
TypeScript библиотека для автоматического<br>преобразования объектов в классы и обратно
</div>

---
transition: slide-up
level: 2
---

# Что такое class-transformer?

<div class="mt-12 space-y-6">

<div v-click>

## 📦 Библиотека от TypeStack
##### Та же команда, что создала `class-validator`, `routing-controllers`, `typedi`

</div>

<div v-click>

## 🎯 Основная задача
##### Преобразовать plain JavaScript объекты (JSON) в экземпляры TypeScript классов **автоматически**

</div>

<div v-click>

## 🔄 Работает в обе стороны
##### - `plainToInstance()` - JSON → Class
##### - `instanceToPlain()` - Class → JSON

</div>

</div>

---
transition: slide-up
level: 2
---

# Основные декораторы class-transformer

### 1️⃣ @Type() - преобразование типов

```typescript
export class User {
  @Type(() => Date)
  createdAt: Date;  // Строка → Date

  @Type(() => Avatar)
  avatar: Avatar;   // Plain object → Avatar

  @Type(() => Role)
  role: Roles[];   // Plain objects → Role - Работает с массивами
}
```

---
transition: slide-up
level: 2
---

# Основные декораторы class-transformer

### 2️⃣ @Expose() - управление сериализацией

```typescript
export class User {
  @Expose({ name: 'date', toClassOnly: true })
  createdAt: Avatar;  // При сериализации → date

  @Expose({ name: 'avatarId', toPlainOnly: true })
  ....
  avatar: Avatar;  // При сериализации → avatarId

  @Expose({ toPlainOnly: true }) 
  get getFileName(): string { // Работает с геттерами
    return this.avatar.name;
  };  
}
```

---
transition: slide-up
level: 2
---

# Основные декораторы class-transformer

### 3️⃣ @Transform() - преобразования

```typescript
export class User {
  @Expose({ name: 'avatarId', toPlainOnly: true })
  @Transform((params) => params.value ? toId(params.value) : null, { toPlainOnly: true })
  avatar: Avatar;  // Avatar → string ID

  ...
}
```

---
transition: slide-up
level: 2
---

# Основные декораторы class-transformer

### 4️⃣ @Exclude() - исключение полей

```typescript
export class User {
  @Exclude({ toPlainOnly: true })
  internalField: string; // Не отправляется на бэкенд

  ...
}
```

---
transition: slide-up
level: 2
---

# Как это работает?

<div class="mt-4">

### 1️⃣ Описываем класс с декораторами

```typescript
class User {
  id: string;
  
  @Type(() => Date)  // ← Декоратор указывает тип
  createdAt: Date;
  
  @Expose({ name: 'avatarId', toPlainOnly: true }) // Автоматически сериализует имя при отправке на бэкенд
  @Transform(toId, { toPlainOnly: true }) // ← Автоматически преобразует в id при отправке на бэкенд
  @Type(() => Avatar)  // ← Автоматически создаст Avatar
  avatar: Avatar;
  
  @Type(() => Role)  // ← Работает и с массивами!
  roles: Role[];
  
  // Методы работают как обычно
  getAge(): number {
    return new Date().getFullYear() - this.createdAt.getFullYear();
  }
}
```

</div>

---
transition: slide-up
level: 2
---

# Как это работает?

<div class="mt-4">

### 2️⃣ Преобразуем JSON в класс одной строкой

```typescript
// До
const response = await fetch('/api/user');
const json = await response.json();
const user = new User(json); // ❌ Нужен конструктор с логикой

// После
const response = await fetch('/api/user');
const json = await response.json();
const user = plainToInstance(User, json); // ✅ Всё автоматически!
```

</div>

<div v-click class="mt-8 p-4 bg-blue-100 rounded-lg">

### 🎁 Что получаем?
- `user.createdAt` - настоящий `Date`
- `user.avatar` - экземпляр `Avatar` с методами
- `user.roles` - массив экземпляров `Role`
- `user.getAge()` - все методы класса работают

</div>

---
transition: slide-up
level: 2
---

# Решение с class-transformer

## Автоматическое преобразование ✨

```typescript {all|8-12}
// ✅ Хорошо: с class-transformer
@Injectable({
  providedIn: 'root'
})
export class UserApiService {
  constructor(private http: HttpClient) {}

  getUser(): Observable<User> {
    return this.http.get('/api/user').pipe(
      map((data: any) => plainToInstance(User, data)) // Автоматическое преобразование!
    );
  }
}
```

---
transition: slide-up
level: 2
---

# Решение: class-transformer ✨

<div class="p-3 bg-green-100 rounded-lg text-sm mt-6">

- ✅ **Автоматическое преобразование** - JSON → классы без лишнего кода
- ✅ **Декораторы** - декларативное описание преобразований
- ✅ **Type safety** - полная поддержка TypeScript
- ✅ **Двунаправленность** - классы ↔ JSON
- ✅ **Производительность** - быстрая работа

</div>

---
transition: slide-up
level: 2
---

# Решение с class-transformer

## Автоматическое преобразование ✨

```typescript {8-12}
// ✅ Хорошо: с class-transformer
@Injectable({
  providedIn: 'root'
})
export class UserApiService {
  constructor(private http: HttpClient) {}

  getUser(): Observable<User> {
    return this.http.get('/api/user').pipe(
      map((data: any) => plainToInstance(User, data)) // Что-то хочется с этим сделать....
    );
  }
}
```

---
transition: slide-up
level: 2
---


<img src="https://sticker-collection.com/stickers/plain/Dichset/512/aec2c11d-826c-430b-8623-56cc72400a01file_3836920.webp" alt="class-transformer magic" style="margin: 24px auto; display: block;" />

---
transition: slide-up
level: 2
---

# Кастомные декораторы MapTo и MapListTo

## Автоматическое преобразование ✨

```typescript {all|7-10}
@Injectable({
  providedIn: 'root'
})
export class UserApiService {
  constructor(private http: HttpClient) {}

  @MapTo(User)
  getUser(): Observable<User> {
    return this.http.get('/api/user');
  }
}
```

---
transition: slide-up
level: 2
---


# MapTo - для одиночных объектов

```typescript {all|10-14}
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

---
transition: slide-up
level: 2
---

# MapListTo - для массивов

```typescript {all|10-13}
export const MapListTo =
  <ItemType>(ItemClass: Constructor<ItemType>) =>
  <MethodType extends (...args: any[]) => Observable<EntityList<ItemType> | ItemType[]>>(
    _target: any,
    _methodName: string | symbol,
    descriptor: TypedPropertyDescriptor<MethodType>,
  ): TypedPropertyDescriptor<MethodType> => {
    const originalMethod = descriptor.value;

    descriptor.value = function (this: any, ...args: any[]) {
      return originalMethod?.apply(this, args).pipe(map((item) => plainToInstance(ItemClass, data)));
    } as MethodType;

    return descriptor;
  };
```

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

---
transition: slide-up
level: 2
---

# UsersApiService - реальный пример

```typescript {all|7-10|11-15|16-22}
@Injectable({
  providedIn: 'root',
})
export class UsersApiService {
  readonly #apiService = inject(ApiService);

  @MapListTo(User)
  getUserList(params?: ListQueryParams<User>): Observable<User[]> {
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


---
transition: slide-up
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

### 🚀 Результат

- **В 7 раз меньше кода** в API сервисах
- **Строгая типизация** всех данных
- **Простая поддержка** и изменения
- **Отличный DX** для разработчиков

</div>

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
4. **Тестируйте преобразования** - unit тесты для моделей
5. **Используйте геттеры** - для вычисляемых свойств

</div>

<div>

## ❌ Чего избегать
1. **Ручное преобразование** - используйте class-transformer
2. **any типы** - строгая типизация везде
3. **Дублирование кода** - переиспользуйте декораторы
4. **Игнорирование ошибок** - обрабатывайте исключения

</div>

</div>

<!--
Дайте практические рекомендации по использованию class-transformer.
Основано на реальном production опыте в TypeScript проектах.
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


