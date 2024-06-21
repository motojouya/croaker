import { getSession } from '@/lib/session';
import { getDatabase, RecordNotFoundError, sqlNow } from '@/database/base';
import { Croak } from '@/database/query/croak';
import { read, update } from '@/database/crud';
// import { deleteCroak } from '@/database/command/deleteCroak';
import { ContextFullFunction, setContext } from '@/lib/base/context';
import { Identifier, AuthorityError, authorizeCroaker } from '@/authorization/base';
import { getCroakerUser } from '@/database/getCroakerUser';
import { AUTHORIZE_FORM_AGREEMENT } from '@/authorization/validation/formAgreement';
import { AUTHORIZE_BANNED } from '@/authorization/validation/banned';
import { getAuthorizeDeleteOtherPost } from '@/authorization/validation/deleteOtherPost';

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
  db: () => getDatabase(null, { getCroakerUser, read, update }), // deleteCroakを使わない
} as const;

export type DeleteCroak = ContextFullFunction<
  typeof deleteCroakContext,
  (identifier: Identifier) => (croakId: number) => Promise<FunctionResult>,
>;
export const deleteCroak: DeleteCroak = ({ db }) => (identifier) => async (croakId) => {

  return await db.transact(async (trx) => {

    const croaks = await trx.read('croak', { croak_id: croakId });
    if (croaks.length !== 1 || !!croaks[0].deleted_date) {
      return new RecordNotFoundError('croak', { croak_id: croakId }, '投稿がすでに存在しません');
    }
    const croak = croaks[0];

    const croaker = await authorizeCroaker(
      identifier,
      trx.getCroakerUser,
      [AUTHORIZE_FORM_AGREEMENT, AUTHORIZE_BANNED, getAuthorizeDeleteOtherPost(croak.croaker_id)]
    );
    if (croaker instanceof AuthorityError) {
      return croaker;
    }

    //return await trx.deleteCroak(croakId);
    return await trx.update('croak', { croak_id: croakId }, { deleted_date: sqlNow() });
  });
};

setContext(deleteCroak, deleteCroakContext);
