import type { GeneratedAlways } from "kysely"

exort interface Role {
  role_id: number;
  name: string;
  ban_power: boolean;
  delete_other_post: boolean;
  post: string;
  post_file: boolean;
  top_post_interval: number;
  show_other_activities: boolean;
}

exort interface Configuration {
  active: boolean;
  account_create_available: boolean;
  default_role_id: number;
  about_contents: string;
}
