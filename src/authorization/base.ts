import { HandleableError } from '@/lib/error';
import { Croaker } from '@/database/query/getCroaker';

import { Banned } from '@/authorization/validation/banned';
import { BanPower } from '@/authorization/validation/banPower';
import { FormAgreement } from '@/authorization/validation/formAgreement';
import { PostCroak } from '@/authorization/validation/postCroak';
import { PostFile } from '@/authorization/validation/postFile';
import { ShowOtherActivities } from '@/authorization/validation/showOtherActivities';
import { DeleteOtherPost } from '@/authorization/validation/deleteOtherPost';

import { InvalidArgumentsError } from '@/lib/base/validation';

export type IdentifierAnonymous = { type: 'anonymous' };
export type IdentifierUserId = { type: 'user_id', user_id: string };
export type Identifier = ActorAnonymous | ActorUserId;

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
export type ClientCroakerAnonymous = { type: 'anonymous' };
export type ClientCroakerLogined = { type: 'logined' };
export type ClientCroakerRegisterd = { type: 'registered', value: Croaker };
export type ClientCroaker = ClientCroakerAnonymous | ClientCroakerLogined | ClientCroakerRegisterd;

export type AuthorizeValidation = (croaker: Croaker) => undefined | AuthorityError;

export type JustLoginUser = (
  identifier: identifier
  getCroaker: () => Promise<Croaker | null>
) => Promise<string | AuthorityError | InvalidArgumentsError>;
export const justLoginUser: JustLoginUser = async (identifier, getCroaker) => {

  if (identifier.type === 'anonymous') {
    return new AuthorityError(null, 'login', 'ログインしてください');
  }
  const userId = identifier.user_id;

  const croaker = await getCroaker(userId);
  if (croaker) {
    return new InvalidArgumentsError('croaker', croaker, 'すでに登録済みです');
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
  identifier: identifier
  getCroaker: () => Promise<Croaker | null>
  additionals?: Validation[]
) => Promise<Croaker | AuthorityError>;
export const authorizeCroaker: AuthorizeCroaker = async (identifier, getCroaker, additionals = []) => {

  if (identifier.type === 'anonymous') {
    return new AuthorityError(null, 'login', 'ログインしてください');
  }

  const croaker = await getCroaker(identifier.user_id);

  if (!croaker) {
    return new AuthorityError(null, 'register', '自身の情報の登録をお願いします');
  }

  for (const addition of additionals) {

    let error:
    switch (addition.type) {

      case 'post_croak':
        const { validation, ...rest } = addition;
        error = await validation(croaker, rest);
        break;

      case 'delete_other_post':
        const { validation, ...rest } = addition;
        error = validation(croaker, rest);
        break;

      default:
        error = addition.validation(croaker);
        break;
    }

    if (error) {
      return error;
    }
  }

  return croaker;
};

export class AuthorityError extends HandleableError {
  override readonly name = 'lib.authorize.AuthorityError' as const;
  constructor(
    readonly croaker_id: string,
    readonly authority: string,
    readonly message: string,
  ) {
    super();
  }
}
