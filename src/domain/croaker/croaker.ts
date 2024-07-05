import { InvalidArgumentsFail } from "@/lib/base/validation";
import { trimText, charCount } from "@/domain/text";

export const DESCRIPTION_COUNT_MAX = 1000;

export type TrimDescription = (description?: string) => string | InvalidArgumentsFail;
export const trimDescription: TrimDescription = (description) => {
  if (!description) {
    return "";
  }

  const lines = trimText(description);
  if (lines.length === 0) {
    return "";
  }

  const len = charCount(lines);
  if (DESCRIPTION_COUNT_MAX < len) {
    return new InvalidArgumentsFail("description", description, `説明は${DESCRIPTION_COUNT_MAX}以下です`);
  }

  return lines.join("\n");
};

export const NAME_COUNT_MAX = 40;

export type TrimName = (name?: string) => string | InvalidArgumentsFail;
export const trimName: TrimName = (name) => {
  if (!name) {
    return new InvalidArgumentsFail("name", "", "名前を入力してください");
  }

  const lines = trimText(name);
  if (lines.length !== 1) {
    return new InvalidArgumentsFail("name", name, "名前は改行できません");
  }

  const trimed = lines[0];

  if (!trimed) {
    return new InvalidArgumentsFail("name", name, "名前を入力してください");
  }

  const len = [...trimed].length;
  if (len < 1 || NAME_COUNT_MAX < len) {
    return new InvalidArgumentsFail("name", name, `名前は1文字以上${NAME_COUNT_MAX}以下です`);
  }

  return trimed;
};

export type CroakerEditableInput = {
  name: string;
  description: string;
};

export type TrimCroakerEditableInput = (input: CroakerEditableInput) => CroakerEditableInput | InvalidArgumentsFail;
export const trimCroakerEditableInput: TrimCroakerEditableInput = (input) => {
  const name = trimName(input.name);
  if (name instanceof InvalidArgumentsFail) {
    return name;
  }

  const description = trimDescription(input.description);
  if (description instanceof InvalidArgumentsFail) {
    return description;
  }

  return { name, description };
};
