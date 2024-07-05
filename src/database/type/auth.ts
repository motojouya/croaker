import { GeneratedAlways, Insertable, Selectable, Updateable } from "kysely";
import { AdapterAccountType } from "@auth/core/adapters";

export interface UserTable {
  id: string; // GeneratedAlways<string>
  name: string | null;
  email: string;
  emailVerified: Date | null;
  image: string | null;
}
export type UserRecord = Selectable<UserTable>;
export type NewUser = Insertable<UserTable>;
export type UserUpdate = Updateable<UserTable>;

export interface AccountTable {
  id: GeneratedAlways<string>;
  userId: string;
  type: AdapterAccountType; //string
  provider: string;
  providerAccountId: string;
  refresh_token?: string;
  access_token?: string;
  expires_at?: number;
  token_type?: Lowercase<string>;
  scope?: string;
  id_token?: string;
  session_state: string | null;
  [parameter: string]: any;
}
export type AccountRecord = Selectable<AccountTable>;
export type NewAccount = Insertable<AccountTable>;
export type AccountUpdate = Updateable<AccountTable>;

export interface SessionTable {
  id: GeneratedAlways<string>;
  userId: string;
  sessionToken: string;
  expires: Date;
}
export type SessionRecord = Selectable<SessionTable>;
export type NewSession = Insertable<SessionTable>;
export type SessionUpdate = Updateable<SessionTable>;

export interface VerificationTokenTable {
  identifier: string;
  token: string;
  expires: Date;
}
export type VerificationTokenRecord = Selectable<VerificationTokenTable>;
export type NewVerificationToken = Insertable<VerificationTokenTable>;
export type VerificationTokenUpdate = Updateable<VerificationTokenTable>;
