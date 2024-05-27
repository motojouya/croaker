import type { GeneratedAlways } from "kysely"
import type {
  User,
  Account,
  Session,
  VerificationToken,
} from '@/rdb/type/auth';
import type {
  Croak,
  Croaker,
} from '@/rdb/type/croak';
import type {
  Role,
  Configuration,
} from '@/rdb/type/master';

export interface Database {
  User: User;
  Account: Account;
  Session: Session;
  VerificationToken: VerificationToken;
  Croak: Croak,
  Croaker: Croaker,
  Role: Role,
  Configuration: Configuration,
}
