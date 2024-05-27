import type { GeneratedAlways } from "kysely"

exort interface Croaker {
  user_id: string;
  identifier: string;
  name: string;
  description: string;
  status: string;
  role_id: number;
  form_agreement: boolean;
  created_date: Date;
  updated_date: Date;
}

exort interface Croak {
  user_id: string;
  croak_id: GeneratedAlways<number>;
  contents: string | null;
  file_path: string | null;
  thread: number | null;
  posted_date: Date;
  delete_date: Date | null;
}
