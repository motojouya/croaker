import { CROAKER_STATUS_BANNED } from "@/database/type/master";
import { AuthorizeValidation, AuthorityFail } from "@/domain/authorization/base";

export type Banned = {
  type: "banned";
  validation: AuthorizeValidation;
};

const authorizeBanned: AuthorizeValidation = (croaker) => {
  if (croaker.status == CROAKER_STATUS_BANNED) {
    return new AuthorityFail(croaker.croaker_id, "banned", "ブロックされたユーザです");
  }
};

export const AUTHORIZE_BANNED: Banned = {
  type: "banned",
  validation: authorizeBanned,
};
