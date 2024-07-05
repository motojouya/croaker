import { getDatabase } from "@/database/base";
import { CroakSimple } from "@/database/query/croakSimple/croakSimple";
import { recentActivities } from "@/database/query/croakSimple/recentActivities";
import { ContextFullFunction, setContext } from "@/lib/base/context";
import { Identifier, AuthorityFail, authorizeCroaker } from "@/domain/authorization/base";
import { getCroakerUser } from "@/database/query/croaker/getCroakerUser";
import { AUTHORIZE_FORM_AGREEMENT } from "@/domain/authorization/validation/formAgreement";
import { AUTHORIZE_BANNED } from "@/domain/authorization/validation/banned";
import { AUTHORIZE_SHOW_OTHER_ACTIVITIES } from "@/domain/authorization/validation/showOtherActivities";

const RECENT_ACTIVITIES_DAYS = 10;

export type FunctionResult = CroakSimple[] | AuthorityFail;

const getRecentActivitiesContext = {
  db: () => getDatabase({ getCroakerUser, recentActivities }, null),
} as const;

export type GetRecentActivities = ContextFullFunction<
  typeof getRecentActivitiesContext,
  (identifier: Identifier) => () => Promise<FunctionResult>
>;
export const getRecentActivities: GetRecentActivities =
  ({ db }) =>
  (identifier) =>
  async () => {
    const croaker = await authorizeCroaker(identifier, db.getCroakerUser, [
      AUTHORIZE_FORM_AGREEMENT,
      AUTHORIZE_BANNED,
      AUTHORIZE_SHOW_OTHER_ACTIVITIES,
    ]);

    if (croaker instanceof AuthorityFail) {
      return croaker;
    }

    return db.recentActivities(croaker.croaker_id, RECENT_ACTIVITIES_DAYS);
  };

setContext(getRecentActivities, getRecentActivitiesContext);
