import { CroakTable } from '@/rdb/type/croak'

export type CroakSimple = Omit<CroakTable, 'user_id'> & {
  croaker_name: string;
};
