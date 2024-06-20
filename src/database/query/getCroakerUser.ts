import { Kysely } from 'kysely'
import type { Croaker } from '@/database/quer/getCroaker';

export type GetCroakerUser = (db: Kysely) => (userId: string) => Promise<Croaker | null>;
export const getCroakerUser: GetCroakerUser = (db) => async (userId) => {

  const results = await db
    .selectFrom('croaker')
    .select([
      'croaker.croaker_id as croaker_id',
      'croaker.name as croaker_name',
      'croaker.description as description',
      'croaker.status as status',
      'croaker.form_agreement as form_agreement',
      'croaker.created_date as created_date',
      'croaker.updated_date as updated_date',
      'role.name as role_name',
      'role.ban_power as role_ban_power',
      'role.delete_other_post as role_delete_other_pos',t
      'role.post as role_post',
      'role.post_file as role_post_file',
      'role.top_post_interval as role_top_post_interval',
      'role.show_other_activities as role_show_other_activities',
    ])
    .innerJoin('role', (join) => {
      join.onRef('croaker.role_id', '=', 'role.role_id');
    })
    .where('croaker.user_id', '=', userId)
    .execute();

  if (results.length > 1) {
    throw new Error('croaker is unique by user_id!');
  }

  if (results.length === 0) {
    return null;
  }

  const {
    role_name,
    role_ban_power,
    role_delete_other_post,
    role_post,
    role_post_file,
    role_top_post_interval,
    role_show_other_activities,
    ...rest,
  } = results[0];

  return {
    ...rest,
    role: {
      name: role_name,
      ban_power: role_ban_power,
      delete_other_post: role_delete_other_post,
      post: role_post,
      post_file: role_post_file,
      top_post_interval: role_top_post_interval,
      show_other_activities: role_show_other_activities,
    }
  };
};
