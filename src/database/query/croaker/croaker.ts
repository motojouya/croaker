
import { CroakerRecord } from '@/database/type/croak';
import { RoleRecord } from '@/database/type/master';

export type Role = Omit<RoleRecord, 'role_id'>;
export type Croaker = Omit<CroakerRecord, 'user_id' | 'role_id' | 'name'> & {
  croaker_name: string;
  role: Role;
};
