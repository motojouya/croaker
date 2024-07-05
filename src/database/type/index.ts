import type { UserTable, AccountTable, SessionTable, VerificationTokenTable } from "@/database/type/auth";
import type { CroakTable, CroakerTable, FileTable, LinkTable } from "@/database/type/croak";
import type { RoleTable, ConfigurationTable } from "@/database/type/master";

export interface Database {
  User: UserTable;
  Account: AccountTable;
  Session: SessionTable;
  VerificationToken: VerificationTokenTable;
  croak: CroakTable;
  croaker: CroakerTable;
  file: FileTable;
  link: LinkTable;
  role: RoleTable;
  configuration: ConfigurationTable;
}
