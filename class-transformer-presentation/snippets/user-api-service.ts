import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { MapListTo, MapTo } from '@monowork/core/decorators';
import { mapInstanceToPlain } from '@monowork/core/helpers';
import { EntityList, ListQueryParams } from '@monowork/core/models';
import { ApiService } from '@monowork/core/services';

import { User } from './user-model';

@Injectable({
  providedIn: 'root',
})
export class UsersApiService {
  readonly #apiService = inject(ApiService);

  @MapListTo(User)
  getUserList(params?: ListQueryParams<User>): Observable<EntityList<User>> {
    return this.#apiService.getList<User>('/api/users', params);
  }

  @MapTo(User)
  getProfile(): Observable<User> {
    return this.#apiService.get<User>('/api/users/profile');
  }

  @MapTo(User)
  updateUser(user: Partial<User>): Observable<User> {
    const transformedUser = mapInstanceToPlain(User, user);
    return this.#apiService.patch<User>('/api/users/profile', transformedUser);
  }

  @MapListTo(User)
  getUsers(): Observable<User[]> {
    return this.#apiService.get<User[]>('/api/users/all');
  }
}
