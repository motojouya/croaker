import { AuthorizeValidation, AuthorityFail } from "@/domain/authorization/base";

export type ShowOtherActivities = {
  type: "show_other_activities";
  validation: AuthorizeValidation;
};

const authorizeShowOtherActivities: AuthorizeValidation = (croaker) => {
  if (!croaker.role.show_other_activities) {
    return new AuthorityFail(
      croaker.croaker_id,
      "show_other_activities",
      "他のユーザの活動まとめを参照することはできません",
    );
  }
};

export const AUTHORIZE_SHOW_OTHER_ACTIVITIES: ShowOtherActivities = {
  type: "show_other_activities",
  validation: authorizeShowOtherActivities,
};
