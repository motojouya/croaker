import { GeneratedAlways, Insertable, Selectable, Updateable } from "kysely";
import { BooleanNumber } from '@/database/type/columnType'

export const POST_AUTHORITY_TOP = "TOP" as const;
export const POST_AUTHORITY_THREAD = "THREAD" as const;
export const POST_AUTHORITY_DISABLE = "DISABLE" as const;
export type PostType = typeof POST_AUTHORITY_TOP | typeof POST_AUTHORITY_THREAD | typeof POST_AUTHORITY_DISABLE;

export interface RoleTable {
  role_id: number;
  name: string;
  ban_power: BooleanNumber;
  delete_other_post: BooleanNumber;
  post: PostType;
  post_file: BooleanNumber;
  top_post_interval: string;
  show_other_activities: BooleanNumber;
}
export type RoleRecord = Selectable<RoleTable>;
export type NewRole = Insertable<RoleTable>;
export type RoleUpdate = Updateable<RoleTable>;

export interface ConfigurationTable {
  title: string;
  active: BooleanNumber;
  account_create_available: BooleanNumber;
  default_role_id: number;
  about_contents: string;
}
export type ConfigurationRecord = Selectable<ConfigurationTable>;
export type NewConfiguration = Insertable<ConfigurationTable>;
export type ConfigurationUpdate = Updateable<ConfigurationTable>;
