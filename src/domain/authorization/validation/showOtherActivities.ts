import { AuthorizeValidation, AuthorityError } from '@/authorization/base';

export type ShowOtherActivities = {
  type: 'show_other_activities';
  validation: AuthorizeValidation;
};

const authorizeShowOtherActivities: AuthorizeShowOtherActivities = (croaker) => {
  if (!croaker.role.show_other_activities) {
    return new AuthorityError(croaker.croaker_id, 'show_other_activities', '他のユーザの活動まとめを参照することはできません');
  }
};

export const AUTHORIZE_SHOW_OTHER_ACTIVITIES = {
  type: 'show_other_activities',
  validation: authorizeShowOtherActivities,
};
