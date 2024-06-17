import { getSession } from '@/lib/next/session';
import { getDatabase, RecordNotFoundError } from '@/database/base';
import { CroakerTable, CROAKER_STATUS_BANNED } from '@/database/type/croak';
import { read, update } from '@/database/query/base';
import { deleteUserCroaks } from '@/database/command/deleteUserCroaks';
import { ContextFullFunction, setContext } from '@/lib/context';
import { AuthorityError, authorizeMutation, authorizeBanPower } from '@/lib/authorize';

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
  db: () => getDatabase({ read }, { read, update, deleteUserCroaks }),
  session: getSession,
} as const;

export type BanCroaker = ContextFullFunction<
  typeof banCroakerContext,
  (croakerIdentifier: string) => Promise<FunctionResult>,
>;
export const banCroaker: BanCroaker = ({ session, db }) => async (croakerIdentifier) => {

  const actor = session.getActor();

  const authorizeMutationErr = authorizeMutation(actor);
  if (authorizeMutationErr) {
    return authorizeMutationErr;
  }

  const actorAuthorities = await db.read('role', { role_name: actor.role_name });
  if (actorAuthorities !== 1) {
    throw new Error('user role is not assigned!');
  }
  const actorAuthority = actorAuthorities[0];

  const authorizeBanPowerErr = authorizeBanPower(actor, actorAuthority);
  if (authorizeBanPowerErr) {
    return authorizeBanPowerErr;
  }

  return await db.transact((trx) => {

    const croakers = await trx.read('croaker', { identifier: croakerIdentifier });
    if (croakers !== 1) {
      return new RecordNotFoundError('croaker', { croaker_identifier: croakerIdentifier }, '存在しないユーザです');
    }
    if (croakers[0].status === CROAKER_STATUS_BANNED) {
      return new RecordNotFoundError('croaker', { croaker_identifier: croakerIdentifier }, 'すでに停止されたユーザです');
    }
    const croaker = croakers[0];

    const croakerUpdated = await trx.update({ identifier: croakerIdentifier }, { status: CROAKER_STATUS_BANNED });

    await trx.deleteUserCroaks({ identifier: croakerIdentifier });

    const { user_id, ...rest } = croakerUpdated;
    return rest;
  });
};

setContext(banCroaker, banCroakerContext);
