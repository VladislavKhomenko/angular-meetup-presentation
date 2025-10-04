/**
 * Пример сложной модели Account с множественными декораторами
 * Показывает продвинутое использование class-transformer
 */

import { Exclude, Expose, Transform, TransformFnParams, Type } from 'class-transformer';
import { toPhoneNumberFormat } from '@monowork/core/helpers';
import { PhoneNumberFormatterPipe } from '@monowork/core/pipes';
import { Nullable } from '@monowork/core/types';

// Импорты связанных моделей
import { BotPosting } from '@sparta/api/bots-posting';
import { Channel } from '@sparta/api/channels';
import { Cycle } from '@sparta/api/cycles';
import { FileUpload } from '@sparta/api/files-upload';
import { Geo } from '@sparta/api/geos';
import { MediaFileDetails } from '@sparta/api/media';

import { ACCOUNTS_STATUS_LABELS_MAP } from '../constants';
import { AccountStatus, AccountType } from '../enums';

/**
 * Сложная модель аккаунта с множественными преобразованиями
 */
export class Account {
  /**
   * Автоматическое преобразование дат
   */
  @Type(() => Date) 
  createdAt: Date;
  
  @Type(() => Date) 
  updatedAt: Date;
  
  @Type(() => Date) 
  deletedAt: Date;
  
  @Type(() => String) 
  tonNumber: string;
  
  @Type(() => Channel) 
  channel: Nullable<Channel>;

  /**
   * Условное преобразование строковых полей
   * Исключает пустые строки при сериализации
   */
  @Transform((params: TransformFnParams) => 
    (params.value ? params.value : undefined), 
    { toPlainOnly: true }
  )
  firstName = '';

  @Transform((params: TransformFnParams) => 
    (params.value ? params.value : undefined), 
    { toPlainOnly: true }
  )
  lastName = '';

  /**
   * Сложное преобразование аватара:
   * 1. При сериализации: avatar → avatarId
   * 2. При десериализации: avatarId → avatar
   * 3. Поддержка как MediaFileDetails, так и FileUpload
   */
  @Expose({ name: 'avatarId', toPlainOnly: true })
  @Transform((params: TransformFnParams) => 
    (params.value ? toId(params.value) : null), 
    { toPlainOnly: true }
  )
  @Type(() => MediaFileDetails)
  avatar: Nullable<MediaFileDetails | FileUpload>;

  /**
   * Преобразование цикла аккаунта
   */
  @Expose({ name: 'cycleId', toPlainOnly: true })
  @Transform((params: TransformFnParams) => 
    (params.value ? toId(params.value) : null), 
    { toPlainOnly: true }
  )
  @Type(() => Cycle)
  cycle: Nullable<Cycle>;

  /**
   * Исключение поля при сериализации
   * joinedChannel не отправляется на бэкенд
   */
  @Exclude({ toPlainOnly: true })
  @Type(() => Channel)
  joinedChannel: Nullable<Channel>;

  /**
   * Преобразование гео-канала
   */
  @Expose({ name: 'geoChannelId', toPlainOnly: true })
  @Transform((params: TransformFnParams) => 
    (params.value ? toId(params.value) : null), 
    { toPlainOnly: true }
  )
  geoChannel: Nullable<AccountGeoChannel>;

  /**
   * Вложенный объект с автоматическим преобразованием
   */
  @Type(() => AccountBotCounters)
  botCounters?: Nullable<AccountBotCounters>;

  // Основные поля
  geoChannelId?: string;
  postingBots?: BotPosting[];

  /**
   * Геттер для полного имени
   */
  get name(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  /**
   * Геттер для статуса с лейблом
   */
  get statusLabel(): string {
    return ACCOUNTS_STATUS_LABELS_MAP[this.status];
  }

  /**
   * Геттер для ссылки на username
   */
  get usernameLink(): string {
    return this.username?.replace('@', '') || '';
  }

  /**
   * Геттер для полного имени
   */
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  /**
   * Геттер для форматированного номера телефона
   */
  get formattedNumber(): string {
    const phoneNumberFormat = toPhoneNumberFormat(this.tonNumber);
    return PhoneNumberFormatterPipe.transform(this.tonNumber, phoneNumberFormat);
  }

  // Основные поля модели
  id: string;
  sessionId: string;
  username: string;
  accountType: AccountType;
  status: AccountStatus;
}

/**
 * Модель счетчиков ботов
 */
export class AccountBotCounters {
  createdToday: number;
  createdTotal: number;
  remainingToday: number;
  remainingTotal: number;

  /**
   * Геттер для лейбла созданных сегодня
   */
  get createdTodayLabel(): string {
    return `${this.createdToday}/${this.remainingToday + this.createdToday}`;
  }

  /**
   * Геттер для лейбла созданных всего
   */
  get createdTotalLabel(): string {
    return `${this.createdTotal}/${this.remainingTotal + this.createdTotal}`;
  }
}

/**
 * Интерфейс для гео-канала аккаунта
 */
export interface AccountGeoChannel {
  id: string;
  geoChannelName: string;
  geo: Geo;
  channel: Channel;
}

/**
 * Пример использования в API сервисе
 */
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { MapTo, MapListTo } from '@monowork/core/decorators';
import { mapInstanceToPlain } from '@monowork/core/helpers';
import { EntityList, ListQueryParams } from '@monowork/core/models';
import { ApiService } from '@monowork/core/services';

@Injectable({
  providedIn: 'root',
})
export class AccountApiService {
  readonly #apiService = inject(ApiService);

  /**
   * Получение списка аккаунтов
   */
  @MapListTo(Account)
  getAccountList(params?: ListQueryParams<Account>): Observable<EntityList<Account>> {
    return this.#apiService.getList<Account>('/api/accounts', params);
  }

  /**
   * Получение аккаунта по ID
   */
  @MapTo(Account)
  getAccount(id: string): Observable<Account> {
    return this.#apiService.get<Account>(`/api/accounts/${id}`);
  }

  /**
   * Создание нового аккаунта
   */
  @MapTo(Account)
  createAccount(account: Partial<Account>): Observable<Account> {
    const transformedAccount = mapInstanceToPlain(Account, account);
    return this.#apiService.post<Account>('/api/accounts', transformedAccount);
  }

  /**
   * Обновление аккаунта
   */
  @MapTo(Account)
  updateAccount(id: string, account: Partial<Account>): Observable<Account> {
    const transformedAccount = mapInstanceToPlain(Account, account);
    return this.#apiService.patch<Account>(`/api/accounts/${id}`, transformedAccount);
  }

  /**
   * Получение аккаунтов по статусу
   */
  @MapListTo(Account)
  getAccountsByStatus(status: AccountStatus): Observable<Account[]> {
    return this.#apiService.get<Account[]>(`/api/accounts?status=${status}`);
  }
}

/**
 * Пример того, что происходит при преобразовании
 */

// 1. Данные с API (plain object)
const apiAccountData = {
  id: "123",
  sessionId: "session_456",
  username: "@john_doe",
  accountType: "PERSONAL",
  status: "ACTIVE",
  firstName: "John",
  lastName: "Doe",
  tonNumber: "+1234567890",
  avatarId: "789",
  cycleId: "101",
  geoChannelId: "202",
  createdAt: "2024-01-15T10:30:00Z",
  updatedAt: "2024-01-15T10:30:00Z",
  deletedAt: null,
  avatar: {
    id: "789",
    filePath: "/uploads/avatar.jpg",
    name: "avatar.jpg",
    mime: "image/jpeg"
  },
  cycle: {
    id: "101",
    name: "Premium Cycle",
    duration: 30
  },
  geoChannel: {
    id: "202",
    geoChannelName: "US Channel",
    geo: { id: "1", name: "United States" },
    channel: { id: "303", name: "US News" }
  },
  botCounters: {
    createdToday: 5,
    createdTotal: 150,
    remainingToday: 95,
    remainingTotal: 2850
  },
  joinedChannel: {
    id: "404",
    name: "Joined Channel"
  }
};

// 2. После @MapTo(Account) - автоматическое преобразование
const account: Account = plainToInstance(Account, apiAccountData);
// account.createdAt - это Date объект
// account.avatar - это экземпляр MediaFileDetails
// account.cycle - это экземпляр Cycle
// account.geoChannel - это экземпляр AccountGeoChannel
// account.botCounters - это экземпляр AccountBotCounters

// 3. При отправке на бэкенд - mapInstanceToPlain(Account, account)
const payload = mapInstanceToPlain(Account, account);
// payload.avatarId = "789" (вместо payload.avatar = MediaFileDetails)
// payload.cycleId = "101" (вместо payload.cycle = Cycle)
// payload.geoChannelId = "202" (вместо payload.geoChannel = AccountGeoChannel)
// payload.joinedChannel - исключен (из-за @Exclude)
// payload.firstName = "John" (если не пустой)
// payload.lastName = "Doe" (если не пустой)

/**
 * Пример использования в компоненте
 */
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-account-details',
  template: `
    <div *ngIf="account$ | async as account">
      <h2>{{ account.name }}</h2>
      <p>Username: {{ account.usernameLink }}</p>
      <p>Status: {{ account.statusLabel }}</p>
      <p>Phone: {{ account.formattedNumber }}</p>
      <p>Created: {{ account.createdAt | date }}</p>
      
      <div *ngIf="account.avatar">
        <img [src]="account.avatar.filePath" [alt]="account.avatar.name">
      </div>
      
      <div *ngIf="account.cycle">
        <p>Cycle: {{ account.cycle.name }}</p>
      </div>
      
      <div *ngIf="account.botCounters">
        <p>Bots Today: {{ account.botCounters.createdTodayLabel }}</p>
        <p>Bots Total: {{ account.botCounters.createdTotalLabel }}</p>
      </div>
    </div>
  `
})
export class AccountDetailsComponent implements OnInit {
  account$: Observable<Account>;

  constructor(private accountApiService: AccountApiService) {}

  ngOnInit() {
    // Автоматическое преобразование происходит в сервисе
    this.account$ = this.accountApiService.getAccount('123');
  }

  updateAccount(accountData: Partial<Account>) {
    // Автоматическое преобразование в обе стороны
    this.accountApiService.updateAccount('123', accountData).subscribe(updatedAccount => {
      console.log('Account updated:', updatedAccount);
    });
  }
}
