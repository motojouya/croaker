import {
  GeneratedAlways,
  Insertable,
  Selectable,
  Updateable
} from 'kysely'

export interface CroakerTable {
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
export type Croaker = Selectable<CroakerTable>
export type NewCroaker = Insertable<CroakerTable>
export type CroakerUpdate = Updateable<CroakerTable>

export interface CroakTable {
  croak_id: GeneratedAlways<number>;
  user_id: string;
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
