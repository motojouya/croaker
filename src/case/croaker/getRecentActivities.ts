import { getSession } from '@/lib/session';
import { getDatabase } from '@/lib/database';
import { CroakMini } from '@/database/query/croak';
import { read } from '@/database/crud';
import { recentActivities } from '@/database/query/recentActivities';
import { ContextFullFunction, setContext } from '@/lib/context';
import {
  AuthorityError,
  authorizeMutation,
  authorizeShowOtherActivities,
} from '@/lib/authorize';

const RECENT_ACTIVITIES_DAYS = 10;

export type FunctionResult = CroakMini[] | AuthorityError;

const getRecentActivitiesContext = {
  db: () => getDatabase({ recentActivities, read }, null),
  session: getSession,
} as const;

export type GetRecentActivities = ContextFullFunction<
  typeof getRecentActivitiesContext,
  () => Promise<FunctionResult>
>;
export const getRecentActivities: GetRecentActivities = ({ session, db }) => async () => {

  const actor = session.getActor();

  const authorizeMutationErr = authorizeMutation(actor);
  if (authorizeMutationErr) {
    return authorizeMutationErr;
  }

  const actorAuthorities = await db.read('role', { role_name: actor.role_name });
  if (actorAuthorities.length !== 1) {
    throw new Error('user role is not assigned!');
  }
  const actorAuthority = actorAuthorities[0];

  const authorizeShowOtherActivitiesErr = authorizeShowOtherActivities(actor, actorAuthority);
  if (authorizeShowOtherActivitiesErr) {
    return authorizeShowOtherActivitiesErr;
  }

  return db.recentActivities(actor.croaker_identifier, RECENT_ACTIVITIES_DAYS);
};

setContext(getRecentActivities, getRecentActivitiesContext);
