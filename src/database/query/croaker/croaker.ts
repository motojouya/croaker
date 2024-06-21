
import { CroakerTable } from '@/database/type/croak';
import { RoleTable } from '@/database/type/master';

export type Role = Omit<RoleTable, 'role_id'>;
export type Croaker = Omit<CroakerTable, 'user_id' | 'role_id' | 'name'> & {
  croaker_name: string;
  role: Role;
};
