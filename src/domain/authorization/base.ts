import { Fail, isFailJSON } from "@/lib/base/fail";
import type { Croaker } from "@/database/query/croaker/croaker";

import { Banned } from "@/domain/authorization/validation/banned";
import { BanPower } from "@/domain/authorization/validation/banPower";
import { FormAgreement } from "@/domain/authorization/validation/formAgreement";
import { PostCroak } from "@/domain/authorization/validation/postCroak";
import { PostFile } from "@/domain/authorization/validation/postFile";
import { ShowOtherActivities } from "@/domain/authorization/validation/showOtherActivities";
import { DeleteOtherPost } from "@/domain/authorization/validation/deleteOtherPost";

import { InvalidArgumentsFail } from "@/lib/base/validation";

export type IdentifierAnonymous = { type: "anonymous" };
export type IdentifierUserId = { type: "user_id"; user_id: string };
export type Identifier = IdentifierAnonymous | IdentifierUserId;

/*
 * 設計方針として、next-authはclientサイドで参照しない
 * 考え方として、next-auth自体が仕様の塊であり、仕様の変更を強く受けてしまいそうな部分であるため
 * したがって、sessionにアクセスするのは常にサーバサイドであり、サーバサイドで取得したsession情報をlayout.tsxにbindすることでアクセスできるようにする
 * これは、clientサイドでuseSession、getSessionしてしまうと、通信が発生しパフォーマンスが悪化するという事情もある
 * ユーザを特定するためのkeyは`user.id = user_id`になるが、この値はいくらかsensitiveなので、これもclientには渡さないように注意する
 * ただ、必要なので、sessionから取れるようにはしておく。
 *
 * ユーザの状態としては、未ログイン -> ログイン -> croaker登録済みという段階で遷移するので、これを意識してコードを書く
 */
export type ClientCroakerAnonymous = { type: "anonymous" };
export type ClientCroakerLogined = { type: "logined" };
export type ClientCroakerRegisterd = { type: "registered"; value: Croaker };
export type ClientCroaker = ClientCroakerAnonymous | ClientCroakerLogined | ClientCroakerRegisterd;

export type AuthorizeValidation = (croaker: Croaker) => undefined | AuthorityFail;

export type JustLoginUser = (
  identifier: Identifier,
  getCroaker: (userId: string) => Promise<Croaker | null>,
) => Promise<string | AuthorityFail | InvalidArgumentsFail>;

export const justLoginUser: JustLoginUser = async (identifier, getCroaker) => {
  if (identifier.type === "anonymous") {
    return new AuthorityFail("anonymous", "login", "ログインしてください");
  }
  const userId = identifier.user_id;

  const croaker = await getCroaker(userId);
  if (croaker) {
    return new InvalidArgumentsFail("croaker", croaker.croaker_id, "すでに登録済みです");
  }

  return userId;
};

export type Validation =
  | Banned
  | BanPower
  | FormAgreement
  | PostCroak
  | PostFile
  | ShowOtherActivities
  | DeleteOtherPost;

export type AuthorizeCroaker = (
  identifier: Identifier,
  getCroaker: (userId: string) => Promise<Croaker | null>,
  additionals?: Validation[],
) => Promise<Croaker | AuthorityFail>;

export const authorizeCroaker: AuthorizeCroaker = async (identifier, getCroaker, additionals = []) => {
  if (identifier.type === "anonymous") {
    return new AuthorityFail("anonymous", "login", "ログインしてください");
  }

  const croaker = await getCroaker(identifier.user_id);

  if (!croaker) {
    return new AuthorityFail("logined", "register", "自身の情報の登録をお願いします");
  }

  for (const addition of additionals) {
    let error;
    switch (addition.type) {
      case "post_croak": {
        const { validation, ...rest } = addition;
        error = await validation(croaker, rest);
        break;
      }
      case "delete_other_post": {
        const { validation, ...rest } = addition;
        error = validation(croaker, rest);
        break;
      }
      default: {
        error = addition.validation(croaker);
        break;
      }
    }

    if (error) {
      return error;
    }
  }

  return croaker;
};

export class AuthorityFail extends Fail {
  constructor(
    readonly croaker_id: string,
    readonly authority: string,
    readonly message: string,
  ) {
    super("lib.authorize.AuthorityFail");
  }
}
export const isAuthorityFail = isFailJSON(new AuthorityFail("", "", ""));
