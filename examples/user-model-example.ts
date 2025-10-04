/**
 * Пример модели User с использованием class-transformer декораторов
 * Показывает реальное использование из production проектов
 */

import { Expose, Transform, TransformFnParams, Type } from 'class-transformer';
import { Permission } from '@monowork/core/enums';
import { Nullable } from '@monowork/core/types';
import { toId } from '@monowork/core/helpers';

/**
 * Модель аватара пользователя
 */
class Avatar {
  id: string;
  filePath: string;
  name: string;
  mime: string;
  originalFilename: string;
  checksum: string;
  privacyPolicy: string;
  uploadedBy: User;

  /**
   * Геттер для получения никнейма загрузившего пользователя
   */
  get uploadedByNickname(): string {
    return this.uploadedBy.nickname;
  }
}

/**
 * Модель пользователя с автоматическим преобразованием типов
 */
export class User {
  /**
   * Автоматическое преобразование строк дат в Date объекты
   */
  @Type(() => Date) 
  createdAt?: Date;
  
  @Type(() => Date) 
  updatedAt?: Date;

  /**
   * Сложное преобразование аватара:
   * 1. При сериализации: avatar → avatarId (строка)
   * 2. При десериализации: avatarId → avatar (объект Avatar)
   * 3. Использует helper toId для извлечения ID из объекта
   */
  @Expose({ name: 'avatarId', toPlainOnly: true })
  @Transform((params: TransformFnParams) => 
    (params.value ? toId(params.value) : null), 
    { toPlainOnly: true }
  )
  @Type(() => Avatar)
  avatar?: Nullable<Avatar>;

  // Основные поля
  id: string;
  nickname: string;
  externalId?: string;
  email: string;
  isEmailVerified?: boolean;
  avatarId?: string;
  permissions: Permission[];

  /**
   * Геттер для получения полного имени пользователя
   */
  get fullName(): string {
    return `${this.nickname} (${this.email})`;
  }

  /**
   * Геттер для проверки верификации email
   */
  get isVerified(): boolean {
    return this.isEmailVerified === true;
  }
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
export class UserApiService {
  readonly #apiService = inject(ApiService);

  /**
   * Получение списка пользователей с автоматическим преобразованием
   * API возвращает EntityList<User>, автоматически преобразуется в экземпляры User
   */
  @MapListTo(User)
  getUserList(params?: ListQueryParams<User>): Observable<EntityList<User>> {
    return this.#apiService.getList<User>('/api/users', params);
  }

  /**
   * Получение профиля пользователя
   * API возвращает plain object, автоматически преобразуется в User
   */
  @MapTo(User)
  getProfile(): Observable<User> {
    return this.#apiService.get<User>('/api/users/profile');
  }

  /**
   * Обновление пользователя
   * 1. Преобразует User в plain object для отправки на бэкенд
   * 2. Получает ответ и преобразует обратно в User
   */
  @MapTo(User)
  updateUser(user: Partial<User>): Observable<User> {
    // Преобразование User → plain object для бэкенда
    const transformedUser = mapInstanceToPlain(User, user);
    
    return this.#apiService.patch<User>('/api/users/profile', transformedUser);
  }

  /**
   * Получение простого массива пользователей
   */
  @MapListTo(User)
  getUsers(): Observable<User[]> {
    return this.#apiService.get<User[]>('/api/users/all');
  }
}

/**
 * Пример того, что происходит при преобразовании
 */

// 1. Данные с API (plain object)
const apiResponse = {
  id: "123",
  nickname: "john_doe",
  email: "john@example.com",
  isEmailVerified: true,
  avatarId: "456",
  createdAt: "2024-01-15T10:30:00Z",
  updatedAt: "2024-01-15T10:30:00Z",
  permissions: ["READ", "WRITE"],
  avatar: {
    id: "456",
    filePath: "/uploads/avatar.jpg",
    name: "avatar.jpg",
    mime: "image/jpeg",
    originalFilename: "my_avatar.jpg",
    checksum: "abc123",
    privacyPolicy: "public",
    uploadedBy: {
      id: "789",
      nickname: "admin"
    }
  }
};

// 2. После @MapTo(User) - автоматическое преобразование
const user: User = plainToInstance(User, apiResponse);
// user.createdAt - это Date объект
// user.avatar - это экземпляр Avatar
// user.avatar.uploadedBy - это экземпляр User

// 3. При отправке на бэкенд - mapInstanceToPlain(User, user)
const payload = mapInstanceToPlain(User, user);
// payload.avatarId = "456" (вместо payload.avatar = Avatar объект)
// payload.createdAt = "2024-01-15T10:30:00.000Z" (ISO строка)

/**
 * Пример использования в компоненте
 */
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-user-profile',
  template: `
    <div *ngIf="user$ | async as user">
      <h2>{{ user.nickname }}</h2>
      <p>Email: {{ user.email }}</p>
      <p>Verified: {{ user.isVerified ? 'Yes' : 'No' }}</p>
      <p>Created: {{ user.createdAt | date }}</p>
      <img *ngIf="user.avatar" [src]="user.avatar.filePath" [alt]="user.avatar.name">
    </div>
  `
})
export class UserProfileComponent implements OnInit {
  user$: Observable<User>;

  constructor(private userApiService: UserApiService) {}

  ngOnInit() {
    // Автоматическое преобразование происходит в сервисе
    this.user$ = this.userApiService.getProfile();
  }

  updateUser(userData: Partial<User>) {
    // Автоматическое преобразование в обе стороны
    this.userApiService.updateUser(userData).subscribe(updatedUser => {
      console.log('User updated:', updatedUser);
    });
  }
}
