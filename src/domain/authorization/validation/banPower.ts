import { AuthorizeValidation, AuthorityError } from '@/authorization/base';

export type BanPower = {
  type: 'ban_power';
  validation: AuthorizeValidation;
};

const authorizeBanPower: AuthorizeValidation = (croaker) => {
  if (!croaker.role.ban_power) {
    return new AuthorityError(croaker.croaker_id, 'ban_power', '他のユーザのアカウントを停止することはできません');
  }
};

export const AUTHORIZE_BAN_POWER = {
  type: 'ban_power',
  validation: authorizeBanPower,
};
