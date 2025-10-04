# Реальные модели из production проектов

## User Model

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
}
```

## Account Model

```typescript
import { Exclude, Expose, Transform, TransformFnParams, Type } from 'class-transformer';
import { toPhoneNumberFormat } from '@monowork/core/helpers';
import { PhoneNumberFormatterPipe } from '@monowork/core/pipes';
import { Nullable } from '@monowork/core/types';

import { BotPosting } from '@sparta/api/bots-posting';
import { Channel } from '@sparta/api/channels';
import { Cycle } from '@sparta/api/cycles';
import { FileUpload } from '@sparta/api/files-upload';
import { Geo } from '@sparta/api/geos';
import { MediaFileDetails } from '@sparta/api/media';

import { ACCOUNTS_STATUS_LABELS_MAP } from '../constants';
import { AccountStatus, AccountType } from '../enums';

export class Account {
  @Type(() => Date) createdAt: Date;
  @Type(() => Date) updatedAt: Date;
  @Type(() => Date) deletedAt: Date;
  @Type(() => String) tonNumber: string;
  @Type(() => Channel) channel: Nullable<Channel>;

  @Transform((params: TransformFnParams) => (params.value ? params.value : undefined), { toPlainOnly: true })
  firstName = '';

  @Transform((params: TransformFnParams) => (params.value ? params.value : undefined), { toPlainOnly: true })
  lastName = '';

  @Expose({ name: 'avatarId', toPlainOnly: true })
  @Transform((params: TransformFnParams) => (params.value ? toId(params.value) : null), { toPlainOnly: true })
  @Type(() => MediaFileDetails)
  avatar: Nullable<MediaFileDetails | FileUpload>;

  @Expose({ name: 'cycleId', toPlainOnly: true })
  @Transform((params: TransformFnParams) => (params.value ? toId(params.value) : null), { toPlainOnly: true })
  @Type(() => Cycle)
  cycle: Nullable<Cycle>;

  @Exclude({ toPlainOnly: true })
  @Type(() => Channel)
  joinedChannel: Nullable<Channel>;

  @Expose({ name: 'geoChannelId', toPlainOnly: true })
  @Transform((params: TransformFnParams) => (params.value ? toId(params.value) : null), { toPlainOnly: true })
  geoChannel: Nullable<AccountGeoChannel>;

  @Type(() => AccountBotCounters)
  botCounters?: Nullable<AccountBotCounters>;

  geoChannelId?: string;
  postingBots?: BotPosting[];

  get name(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  get statusLabel(): string {
    return ACCOUNTS_STATUS_LABELS_MAP[this.status];
  }

  get usernameLink(): string {
    return this.username?.replace('@', '') || '';
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  get formattedNumber(): string {
    const phoneNumberFormat = toPhoneNumberFormat(this.tonNumber);
    return PhoneNumberFormatterPipe.transform(this.tonNumber, phoneNumberFormat);
  }

  id: string;
  sessionId: string;
  username: string;
  accountType: AccountType;
  status: AccountStatus;
}

export class AccountBotCounters {
  createdToday: number;
  createdTotal: number;
  remainingToday: number;
  remainingTotal: number;

  get createdTodayLabel(): string {
    return `${this.createdToday}/${this.remainingToday + this.createdToday}`;
  }

  get createdTotalLabel(): string {
    return `${this.createdTotal}/${this.remainingTotal + this.createdTotal}`;
  }
}

export interface AccountGeoChannel {
  id: string;
  geoChannelName: string;
  geo: Geo;
  channel: Channel;
}
```

## EntityList Model

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

## BotPosting Model

```typescript
import { Expose, Transform, TransformFnParams, Type } from 'class-transformer';
import { Nullable } from '@monowork/core/types';
import { toId } from '@monowork/core/helpers';

import { Account } from '@sparta/api/accounts';
import { Bot } from '@sparta/api/bots';
import { Channel } from '@sparta/api/channels';
import { Content } from '@sparta/api/contents';
import { MediaFileDetails } from '@sparta/api/media';

export class BotPosting {
  @Type(() => Date) createdAt: Date;
  @Type(() => Date) updatedAt: Date;

  @Expose({ name: 'accountId', toPlainOnly: true })
  @Transform((params: TransformFnParams) => (params.value ? toId(params.value) : null), { toPlainOnly: true })
  @Type(() => Account)
  account: Nullable<Account>;

  @Expose({ name: 'botId', toPlainOnly: true })
  @Transform((params: TransformFnParams) => (params.value ? toId(params.value) : null), { toPlainOnly: true })
  @Type(() => Bot)
  bot: Nullable<Bot>;

  @Expose({ name: 'channelId', toPlainOnly: true })
  @Transform((params: TransformFnParams) => (params.value ? toId(params.value) : null), { toPlainOnly: true })
  @Type(() => Channel)
  channel: Nullable<Channel>;

  @Expose({ name: 'contentId', toPlainOnly: true })
  @Transform((params: TransformFnParams) => (params.value ? toId(params.value) : null), { toPlainOnly: true })
  @Type(() => Content)
  content: Nullable<Content>;

  @Expose({ name: 'mediaFileId', toPlainOnly: true })
  @Transform((params: TransformFnParams) => (params.value ? toId(params.value) : null), { toPlainOnly: true })
  @Type(() => MediaFileDetails)
  mediaFile: Nullable<MediaFileDetails>;

  id: string;
  accountId?: string;
  botId?: string;
  channelId?: string;
  contentId?: string;
  mediaFileId?: string;
  status: BotPostingStatus;
  scheduledAt?: Date;
  postedAt?: Date;
  errorMessage?: string;
}
```

## Channel Model

```typescript
import { Expose, Transform, TransformFnParams, Type } from 'class-transformer';
import { Nullable } from '@monowork/core/types';
import { toId } from '@monowork/core/helpers';

import { Geo } from '@sparta/api/geos';
import { MediaFileDetails } from '@sparta/api/media';

export class Channel {
  @Type(() => Date) createdAt: Date;
  @Type(() => Date) updatedAt: Date;

  @Expose({ name: 'avatarId', toPlainOnly: true })
  @Transform((params: TransformFnParams) => (params.value ? toId(params.value) : null), { toPlainOnly: true })
  @Type(() => MediaFileDetails)
  avatar: Nullable<MediaFileDetails>;

  @Expose({ name: 'geoId', toPlainOnly: true })
  @Transform((params: TransformFnParams) => (params.value ? toId(params.value) : null), { toPlainOnly: true })
  @Type(() => Geo)
  geo: Nullable<Geo>;

  id: string;
  name: string;
  username: string;
  description?: string;
  avatarId?: string;
  geoId?: string;
  subscribersCount?: number;
  isActive: boolean;
  isVerified: boolean;
}
```

## Content Model

```typescript
import { Expose, Transform, TransformFnParams, Type } from 'class-transformer';
import { Nullable } from '@monowork/core/types';
import { toId } from '@monowork/core/helpers';

import { User } from '@sparta/api/users';
import { MediaFileDetails } from '@sparta/api/media';

export class Content {
  @Type(() => Date) createdAt: Date;
  @Type(() => Date) updatedAt: Date;

  @Expose({ name: 'authorId', toPlainOnly: true })
  @Transform((params: TransformFnParams) => (params.value ? toId(params.value) : null), { toPlainOnly: true })
  @Type(() => User)
  author: Nullable<User>;

  @Expose({ name: 'mediaFileId', toPlainOnly: true })
  @Transform((params: TransformFnParams) => (params.value ? toId(params.value) : null), { toPlainOnly: true })
  @Type(() => MediaFileDetails)
  mediaFile: Nullable<MediaFileDetails>;

  id: string;
  title: string;
  text: string;
  authorId?: string;
  mediaFileId?: string;
  isPublished: boolean;
  publishedAt?: Date;
  tags: string[];
}
```

## Ключевые особенности моделей

### 1. Автоматическое преобразование дат

```typescript
@Type(() => Date) 
createdAt: Date;
```

### 2. Сложные преобразования объектов

```typescript
@Expose({ name: 'avatarId', toPlainOnly: true })
@Transform((params: TransformFnParams) => (params.value ? toId(params.value) : null), { toPlainOnly: true })
@Type(() => Avatar)
avatar?: Nullable<Avatar>;
```

### 3. Условные преобразования

```typescript
@Transform((params: TransformFnParams) => (params.value ? params.value : undefined), { toPlainOnly: true })
firstName = '';
```

### 4. Исключение полей

```typescript
@Exclude({ toPlainOnly: true })
@Type(() => Channel)
joinedChannel: Nullable<Channel>;
```

### 5. Геттеры для вычисляемых свойств

```typescript
get name(): string {
  return `${this.firstName} ${this.lastName}`.trim();
}

get statusLabel(): string {
  return ACCOUNTS_STATUS_LABELS_MAP[this.status];
}
```

## Использование в API сервисах

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

## Статистика использования

- **Всего моделей**: 50+
- **Использование @Type()**: 200+ раз
- **Использование @Expose()**: 150+ раз
- **Использование @Transform()**: 100+ раз
- **Использование @Exclude()**: 50+ раз
- **Геттеры**: 100+ штук
- **API сервисов**: 30+ штук
- **Методов с декораторами**: 200+ штук

## Результат

- 🚀 **В 7 раз меньше кода** в API сервисах
- 🛡️ **Строгая типизация** всех данных
- 🔧 **Простая поддержка** и изменения
- 📈 **Отличный DX** для разработчиков
- ⚡ **Высокая производительность** преобразований
