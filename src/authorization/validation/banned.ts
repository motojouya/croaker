import { CROAKER_STATUS_BANNED } from '@/rdb/type/master';
import { AuthorizeValidation, AuthorityError } from '@/authorization/base';

export type BANNED = {
  type: 'banned';
  validation: AuthorizeValidation;
};

const authorizeBanned: AuthorizeBanned = (croaker) => {
  if (croaker.status == CROAKER_STATUS_BANNED) {
    return new AuthorityError(croaker.croaker_id, 'banned', 'ブロックされたユーザです');
  }
};

export const AUTHORIZE_BANNED = {
  type: 'banned',
  validation: authorizeBanned,
};
