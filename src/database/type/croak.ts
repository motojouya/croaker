import {
  GeneratedAlways,
  Insertable,
  Selectable,
  Updateable
} from 'kysely'

export const CROAKER_STATUS_ACTIVE = 'ACTIVE';
export const CROAKER_STATUS_BANNED = 'BANNED';

export interface CroakerTable {
  user_id: string;
  croaker_id: string;
  name: string;
  description: string;
  status: string;
  role_id: number;
  form_agreement: boolean;
  created_date: Date;
  updated_date: Date;
}
export type Croaker = Selectable<CroakerTable>
export type NewCroaker = Insertable<CroakerTable>
export type CroakerUpdate = Updateable<CroakerTable>

export interface CroakTable {
  croak_id: GeneratedAlways<number>;
  croaker_id: string;
  contents: string | null;
  file_path: string | null;
  thread: number | null;
  posted_date: Date;
  delete_date: Date | null;
}
export type Croak = Selectable<CroakTable>
export type NewCroak = Insertable<CroakTable>
export type CroakUpdate = Updateable<CroakTable>

export interface LinkTable {
  croak_id: number;
  url: string;
  type: string;
  title: string | null;
  image: string | null;
  summary: string | null;
  created_date: Date;
}
export type Link = Selectable<LinkTable>
export type NewLink = Insertable<LinkTable>
export type LinkUpdate = Updateable<LinkTable>

export const STORAGE_TYPE_GCS = 'GCS';

export interface FileTable {
  file_id: GeneratedAlways<number>;
  croak_id: number;
  storage_type: string;
  source: string;
  name: string;
  content_type: string;
  created_date: Date;
}
export type File = Selectable<FileTable>
export type NewFile = Insertable<FileTable>
export type FileUpdate = Updateable<FileTable>

