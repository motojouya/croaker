import { getSession } from '@/lib/session';
import { getDatabase, RecordNotFoundError, sqlNow } from '@/database/base';
import { Croak } from '@/database/query/croak';
import { read, update } from '@/database/crud';
// import { deleteCroak } from '@/database/command/deleteCroak';
import { ContextFullFunction, setContext } from '@/lib/base/context';
import { AuthorityError, authorizeMutation } from '@/domain/authorize';

// export type DeleteCroak = ContextFullFunction<
//   {
//     session: Session,
//     db: DB<{}, {
//       read: ReturnType<typeof read>,
//       update: ReturnType<typeof update>,
//     }>,
//   },
//   (croakId: number) => Promise<Croak | AuthorityError>
// >;

export type FunctionResult = Croak | AuthorityError;

const deleteCroakContext = {
  db: () => getDatabase(null, { read, update }), // deleteCroakを使わない
  session: getSession,
} as const;

export type DeleteCroak = ContextFullFunction<
  typeof deleteCroakContext,
  (croakId: number) => Promise<FunctionResult>,
>;
export const deleteCroak: DeleteCroak = ({ session, db }) => async (croakId) => {

  const actor = session.getActor();

  const authorizeMutationErr = authorizeMutation(actor);
  if (authorizeMutationErr) {
    return authorizeMutationErr;
  }

  return await db.transact(async (trx) => {

    const actorAuthority = await trx.read('role', { role_name: actor.role_name });
    if (!actorAuthority) {
      throw new Error('user role is not assigned!');
    }

    const croak = await trx.read('croak', { croak_id: croakId });
    if (!croak || !!croak.deleted_date) {
      return new RecordNotFoundError('croak', { croak_id: croakId }, '投稿がすでに存在しません');
    }

    if (!croak.user_id === actor.user_id && !actorAuthority.delete_other_post) {
      return new AuthorityError(actor.croaker_identifier, 'delete_other_post', '自分以外の投稿を削除することはできません');
    }

    //return await trx.deleteCroak(croakId);
    return await trx.update('croak', { croak_id: croakId }, { deleted_date: sqlNow() });
  });
};

setContext(deleteCroak, deleteCroakContext);
