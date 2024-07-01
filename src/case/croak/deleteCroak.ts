import { getDatabase, RecordNotFoundFail, sqlNow } from '@/database/base';
import { CroakRecord } from '@/database/type/croak';
import { read, update } from '@/database/crud';
// import { deleteCroak } from '@/database/command/deleteCroak';
import { ContextFullFunction, setContext } from '@/lib/base/context';
import { Identifier, AuthorityFail, authorizeCroaker } from '@/domain/authorization/base';
import { getCroakerUser } from '@/database/query/croaker/getCroakerUser';
import { AUTHORIZE_FORM_AGREEMENT } from '@/domain/authorization/validation/formAgreement';
import { AUTHORIZE_BANNED } from '@/domain/authorization/validation/banned';
import { getAuthorizeDeleteOtherPost } from '@/domain/authorization/validation/deleteOtherPost';

// export type DeleteCroak = ContextFullFunction<
//   {
//     session: Session,
//     db: DB<{}, {
//       read: ReturnType<typeof read>,
//       update: ReturnType<typeof update>,
//     }>,
//   },
//   (croakId: number) => Promise<Croak | AuthorityFail>
// >;

export type Croak = CroakRecord;

export type FunctionResult = Croak | AuthorityFail | RecordNotFoundFail;

const deleteCroakContext = {
  db: () => getDatabase(null, { getCroakerUser, read, update }), // deleteCroakを使わない
} as const;

export type DeleteCroak = ContextFullFunction<
  typeof deleteCroakContext,
  (identifier: Identifier) => (croakId: number) => Promise<FunctionResult>
>;
export const deleteCroak: DeleteCroak = ({ db }) => (identifier) => async (croakId) => {

  return await db.transact(async (trx) => {

    const croak = await getCroak(trx, croakId);
    if (croak instanceof RecordNotFoundFail) {
      return croak;
    }

    const croaker = await authorizeCroaker(
      identifier,
      trx.getCroakerUser,
      [AUTHORIZE_FORM_AGREEMENT, AUTHORIZE_BANNED, getAuthorizeDeleteOtherPost(croak.croaker_id)]
    );
    if (croaker instanceof AuthorityFail) {
      return croaker;
    }

    //return await trx.deleteCroak(croakId);
    const result = await trx.update('croak', { croak_id: croakId }, { deleted_date: sqlNow() });
    if (result.length !== 1) {
      throw new Error('croak shoud be unique by croak_id');
    }

    return result[0];
  });
};

setContext(deleteCroak, deleteCroakContext);

type ReadableDB = { read: ReturnType<typeof read> };
type GetCroak = (db: ReadableDB, croakId: number) => Promise<Croak | RecordNotFoundFail>
const getCroak: GetCroak = async (db, croakId) => {

  const croaks = await db.read('croak', { croak_id: croakId });
  if (croaks.length !== 1 || !!croaks[0].deleted_date) {
    return new RecordNotFoundFail('croak', { croak_id: croakId }, '投稿がすでに存在しません');
  }

  return croaks[0];
};
