import { GeneratedAlways, Generated, Insertable, Selectable, Updateable } from "kysely";

export const CROAKER_STATUS_ACTIVE = "ACTIVE" as const;
export const CROAKER_STATUS_BANNED = "BANNED" as const;
export type CroakerStatus = typeof CROAKER_STATUS_ACTIVE | typeof CROAKER_STATUS_BANNED;

export interface CroakerTable {
  user_id: string;
  croaker_id: string;
  name: string;
  description: string;
  status: CroakerStatus;
  role_id: number;
  form_agreement: Date | null;
  created_date: Generated<Date>;
  updated_date: Generated<Date>;
}
export type CroakerRecord = Selectable<CroakerTable>;
export type NewCroaker = Insertable<CroakerTable>;
export type CroakerUpdate = Updateable<CroakerTable>;

export interface CroakTable {
  croak_id: GeneratedAlways<number>;
  croaker_id: string;
  contents: string | null;
  thread: number | null;
  posted_date: Generated<Date>;
  deleted_date: Date | null;
}
export type CroakRecord = Selectable<CroakTable>;
export type NewCroak = Insertable<CroakTable>;
export type CroakUpdate = Updateable<CroakTable>;

export interface LinkTable {
  croak_id: number;
  source: string;
  url: string | null;
  type: string | null;
  title: string | null;
  image: string | null;
  description: string | null;
  site_name: string | null;
  created_date: Generated<Date>;
}
export type LinkRecord = Selectable<LinkTable>;
export type NewLink = Insertable<LinkTable>;
export type LinkUpdate = Updateable<LinkTable>;

export const STORAGE_TYPE_GCS = "GCS";

export interface FileTable {
  file_id: GeneratedAlways<number>;
  croak_id: number;
  storage_type: string;
  source: string;
  name: string;
  content_type: string;
  created_date: Generated<Date>;
}
export type FileRecord = Selectable<FileTable>;
export type NewFile = Insertable<FileTable>;
export type FileUpdate = Updateable<FileTable>;
