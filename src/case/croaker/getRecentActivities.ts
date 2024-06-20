import { getDatabase } from '@/lib/database/base';
import { CroakMini } from '@/database/query/croak';
import { recentActivities } from '@/database/query/recentActivities';
import { ContextFullFunction, setContext } from '@/lib/base/context';
import { Identifier, AuthorityError, authorize } from '@/authorization/base';
import { getCroakerUser } from '@/database/getCroakerUser';
import { AUTHORIZE_FORM_AGREEMENT } from '@/authorization/validation/formAgreement'; 
import { AUTHORIZE_BANNED } from '@/authorization/validation/banned'; 
import { AUTHORIZE_SHOW_OTHER_ACTIVITIES } from '@/authorization/validation/showOtherActivities'; 

const RECENT_ACTIVITIES_DAYS = 10;

export type FunctionResult = CroakMini[] | AuthorityError;

const getRecentActivitiesContext = {
  db: () => getDatabase({ getCroakerUser, recentActivities }, null),
} as const;

export type GetRecentActivities = ContextFullFunction<
  typeof getRecentActivitiesContext,
  (identifier: Identifier) => () => Promise<FunctionResult>
>;
export const getRecentActivities: GetRecentActivities = ({ db }) => (identifier) => async () => {

  if (identifier.type === 'anonymous') {
    return new AuthorityError(null, 'login', 'ログインしてください');
  }

  const croaker = await db.getCroakerUser(identifier.user_id);

  const authorizeErr = await authorize(croaker, [AUTHORIZE_FORM_AGREEMENT, AUTHORIZE_BANNED, AUTHORIZE_SHOW_OTHER_ACTIVITIES]);
  if (authorizeErr) {
    return authorizeErr;
  }

  return db.recentActivities(croaker.croaker_id, RECENT_ACTIVITIES_DAYS);
};

setContext(getRecentActivities, getRecentActivitiesContext);
