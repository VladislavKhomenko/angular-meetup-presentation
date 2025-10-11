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

  get fullName(): string {
    return `${this.nickname} (${this.email})`;
  }
}
