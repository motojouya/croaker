import { Storage } from "@/lib/io/fileStorage";
import { FileFail } from "@/lib/io/fileStorageFail";
import { CroakRecord, LinkRecord, FileRecord } from "@/database/type/croak";

import { InvalidArgumentsFail } from "@/lib/base/validation";
import { trimText, charCount } from "@/domain/text";

export type FileResource = {
  name: string;
  url: string;
  content_type: string;
};

export type Link = LinkRecord;
export type File = FileRecord;
export type Croak = Omit<CroakRecord, "user_id"> & {
  has_thread: boolean;
  croaker_name: string;
  links: Link[];
  files: FileResource[];
};

export type ResolveFileUrl = (
  storage: Storage,
  croak: Omit<Croak, "files">,
  files: File[],
) => Promise<Croak | FileFail>;

export const resolveFileUrl: ResolveFileUrl = async (storage, croak, files) => {
  const promises = [];
  const fileResources: FileResource[] = [];
  const errors: FileFail[] = [];
  for (const file of files) {
    promises.push(
      new Promise(async (resolve) => {
        const fileUrl = await storage.generatePreSignedUrl(file.source);
        if (fileUrl instanceof FileFail) {
          errors.push(fileUrl);
        } else {
          fileResources.push({
            name: file.name,
            url: fileUrl,
            content_type: file.content_type,
          });
        }
        resolve(null);
      }),
    );
  }

  await Promise.allSettled(promises);

  if (errors.length > 0) {
    return errors[0]; // TODO とりあえず最初の1つ
  }

  return {
    ...croak,
    files: fileResources,
  };
};

export const CONTENTS_COUNT_MAX = 140;

export type TrimContents = (contents?: string) => string | InvalidArgumentsFail;
export const trimContents: TrimContents = (contents) => {
  if (!contents) {
    return new InvalidArgumentsFail("contents", "", "入力してください");
  }

  const lines = trimText(contents);
  if (lines.length === 0) {
    return new InvalidArgumentsFail("contents", contents, "入力してください");
  }

  const len = charCount(lines);
  if (len < 1 || CONTENTS_COUNT_MAX < len) {
    return new InvalidArgumentsFail("contents", contents, `1文字以上${CONTENTS_COUNT_MAX}以下です`);
  }

  return lines.join("\n");
};

export const URL_REG_EXP = new RegExp("^https://S+$");

export type GetLinks = (text: string) => string[];
export const getLinks: GetLinks = (text) => {
  const lines = trimText(text);
  return lines.filter((line) => URL_REG_EXP.test(line));
};
