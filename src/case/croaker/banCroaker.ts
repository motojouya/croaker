import { getDatabase, RecordNotFoundError, sqlNow } from '@/database/base';
import { CroakerTable, CROAKER_STATUS_BANNED } from '@/database/type/croak';
import { read, update } from '@/database/query/base';
// import { deleteUserCroaks } from '@/database/command/deleteUserCroaks';
import { ContextFullFunction, setContext } from '@/lib/base/context';
import { Identifier, AuthorityError, authorizeCroaker } from '@/authorization/base';
import { getCroakerUser } from '@/database/getCroakerUser';
import { AUTHORIZE_FORM_AGREEMENT } from '@/authorization/validation/formAgreement'; 
import { AUTHORIZE_BANNED } from '@/authorization/validation/banned'; 
import { AUTHORIZE_BAN_POWER } from '@/authorization/validation/banPower'; 

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

export type Croaker = Omit<CroakerTable, 'user_id'>;

export type FunctionResult = Croaker | AuthorityError;

const banCroakerContext = {
  db: () => getDatabase({ getCroakerUser }, { read, update }), // deleteUserCroaks は使わない
} as const;

export type BanCroaker = ContextFullFunction<
  typeof banCroakerContext,
  (identifier: Identifier) => (croakerId: string) => Promise<FunctionResult>,
>;
export const banCroaker: BanCroaker = ({ db }) => (identifier) => async (croakerId) => {

  const croakerActor = await authorizeCroaker(
    identifier,
    db.getCroakerUser,
    [AUTHORIZE_FORM_AGREEMENT, AUTHORIZE_BANNED, AUTHORIZE_BAN_POWER]
  );
  if (croakerActor instanceof AuthorityError) {
    return croakerActor;
  }

  return await db.transact(async (trx) => {

    const croaker = await getCroaker(trx, croakerId);
    if (croaker instanceof RecordNotFoundError) {
      return croaker;
    }

    const croakerUpdated = await trx.update('croaker', { croaker_id: croakerId }, { status: CROAKER_STATUS_BANNED });

    // await trx.deleteUserCroaks({ identifier: croakerIdentifier });
    await trx.update('croak', { croaker_id: croakerId }, { deleted_date: sqlNow() });

    const { user_id, ...rest } = croakerUpdated;
    return rest;
  });
};

setContext(banCroaker, banCroakerContext);

type ReadableDB = { read: ReturnType<typeof read> };
type GetCroaker = (db: ReadableDB, croakerId: string) => Promise<CroakerTable | RecordNotFoundError>
const getCroaker: GetCroaker = (db, croakerId) => {

    const croakers = await trx.read('croaker', { croaker_id: croakerId });
    if (croakers !== 1) {
      return new RecordNotFoundError('croaker', { croaker_id: croakerId }, '存在しないユーザです');
    }

    const croaker = croakers[0];

    if (croaker.status === CROAKER_STATUS_BANNED) {
      return new RecordNotFoundError('croaker', { croaker_id: croakerId }, 'すでに停止されたユーザです');
    }

    return croaker;
};

