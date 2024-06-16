import type {
  UserTable,
  AccountTable,
  SessionTable,
  VerificationTokenTable,
} from '@/rdb/type/auth';
import type {
  CroakTable,
  CroakerTable,
} from '@/rdb/type/croak';
import type {
  RoleTable,
  ConfigurationTable,
} from '@/rdb/type/master';

export interface Database {
  User: UserTable;
  Account: AccountTable;
  Session: SessionTable;
  VerificationToken: VerificationTokenTable;
  Croak: CroakTable,
  Croaker: CroakerTable,
  Role: RoleTable,
  Configuration: ConfigurationTable,
}
