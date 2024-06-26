import type {
  UserTable,
  AccountTable,
  SessionTable,
  VerificationTokenTable,
} from '@/database/type/auth';
import type {
  CroakTable,
  CroakerTable,
} from '@/database/type/croak';
import type {
  RoleTable,
  ConfigurationTable,
} from '@/database/type/master';

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
