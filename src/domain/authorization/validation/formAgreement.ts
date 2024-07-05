import { AuthorizeValidation, AuthorityFail } from "@/domain/authorization/base";

export type FormAgreement = {
  type: "form_agreement";
  validation: AuthorizeValidation;
};

const authorizeFormAgreement: AuthorizeValidation = (croaker) => {
  if (!croaker.form_agreement) {
    return new AuthorityFail(
      croaker.croaker_id,
      "form_agreement",
      "投稿前にプロフィールの編集とお願いへの同意をしてください",
    );
  }
};

export const AUTHORIZE_FORM_AGREEMENT: FormAgreement = {
  type: "form_agreement",
  validation: authorizeFormAgreement,
};
