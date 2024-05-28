import {
  GeneratedAlways,
  Insertable,
  Selectable,
  Updateable
} from 'kysely'

exort interface RoleTable {
  role_id: number;
  name: string;
  ban_power: boolean;
  delete_other_post: boolean;
  post: string;
  post_file: boolean;
  top_post_interval: number;
  show_other_activities: boolean;
}
export type Role = Selectable<RoleTable>
export type NewRole = Insertable<RoleTable>
export type RoleUpdate = Updateable<RoleTable>

exort interface ConfigurationTable {
  active: boolean;
  account_create_available: boolean;
  default_role_id: number;
  about_contents: string;
}
export type Configuration = Selectable<ConfigurationTable>
export type NewConfiguration = Insertable<ConfigurationTable>
export type ConfigurationUpdate = Updateable<ConfigurationTable>
