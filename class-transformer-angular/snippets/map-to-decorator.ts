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
