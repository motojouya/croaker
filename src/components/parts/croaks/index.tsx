import React from "react";
import { useState } from "react";
import { isAuthorityFail } from "@/domain/authorization/base";
import { isFetchAccessFail } from "@/lib/io/linkFail";
import { isFileFail } from "@/lib/io/fileStorageFail";
import { isImageCommandFail, isImageInformationFail } from "@/lib/io/imageFail";
import { isInvalidArguments } from "@/lib/base/validation";
import { doFetch } from "@/lib/next/utility";
import type { ResponseType as ResponseTypeTopText } from "@/app/api/croak/top/text/route";
import type { ResponseType as ResponseTypeTopFile } from "@/app/api/croak/top/file/route";
import { v4 as uuid } from "uuid";
import { ClientCroaker } from "@/domain/authorization/base";
import { replaceArray, removeArray } from "@/lib/next/utility";
import { GetCroaks, LoadingCroaks } from "@/components/parts/croaks/loadingCroakList";
import { PostingText, PostingFile, InputCroak, InputCroaks } from "@/components/parts/croaks/inputCroakList";
import { CroakInputFooter, RegisterFooter } from "@/components/parts/croaks/footer";
import type { Croaker } from "@/database/query/croaker/croaker";

type EqualInputCroak = (left: InputCroak, right: InputCroak) => boolean;
const equalInputCroak: EqualInputCroak = (left, right) => left.key === right.key;

type ChangeInputCroaks = (inputCroaks: InputCroak[]) => InputCroak[];

type PostText = (
  thread: number | null,
  setInputCroaks: (setter: ChangeInputCroaks) => void,
  newInput: PostingText,
) => Promise<void>;
const postText: PostText = async (thread, setInputCroaks, newInput) => {
  const result = await doFetch<ResponseTypeTopText>(`/api/croak/${thread || "top"}/text`, {
    method: "POST",
    body: JSON.stringify({ contents: newInput.contents }),
  });

  if (isAuthorityFail(result) || isFetchAccessFail(result) || isInvalidArguments(result)) {
    setInputCroaks(
      replaceArray(equalInputCroak)({
        ...newInput,
        type: "text_error",
        errorMessage: result.message,
      }),
    );
  } else {
    setInputCroaks(
      replaceArray(equalInputCroak)({
        key: newInput.key,
        type: "posted",
        croak: result,
      }),
    );
  }
};

type PostFile = (
  thread: number | null,
  setInputCroaks: (setter: ChangeInputCroaks) => void,
  newInput: PostingFile,
) => Promise<void>;
const postFile: PostFile = async (thread, setInputCroaks, newInput) => {
  const file = newInput.file;
  const formData = new FormData();
  formData.append("file", file, file.name);

  const result = await doFetch<ResponseTypeTopFile>(`/api/croak/${thread || "top"}/file`, {
    method: "POST",
    body: formData,
  });

  if (
    isAuthorityFail(result) ||
    isFetchAccessFail(result) ||
    isInvalidArguments(result) ||
    isFileFail(result) ||
    isImageCommandFail(result) ||
    isImageInformationFail(result)
  ) {
    setInputCroaks(
      replaceArray(equalInputCroak)({
        ...newInput,
        type: "file_error",
        errorMessage: result.message,
      }),
    );
  } else {
    setInputCroaks(
      replaceArray(equalInputCroak)({
        key: newInput.key,
        type: "posted",
        croak: result,
      }),
    );
  }
};

type UseInputCroaks = (
  thread: number | null,
) => [InputCroak[], (text: string) => void, (file: File) => void, (input: InputCroak) => () => void];
const useInputCroaks: UseInputCroaks = (thread) => {
  const [inputCroaks, setInputCroaks] = useState<InputCroak[]>([]);

  const setText = (text: string) => {
    const newInput = {
      key: uuid(),
      type: "text",
      contents: text,
    } as const;
    setInputCroaks((oldInputs) => [newInput, ...oldInputs]);
    postText(thread, setInputCroaks, newInput); // TODO need setTime?
  };

  const setFile = (file: File) => {
    const newInput = {
      key: uuid(),
      type: "file",
      file: file,
    } as const;
    setInputCroaks((oldInputs) => [newInput, ...oldInputs]);
    postFile(thread, setInputCroaks, newInput); // TODO need setTime?
  };

  const cancelCroak = (inputCroak: InputCroak) => () => {
    setInputCroaks(removeArray(equalInputCroak)(inputCroak));
  };

  return [inputCroaks, setText, setFile, cancelCroak];
};

const Spacing: React.FC<{}> = () => <div className="w-full max-w-5xl h-12"></div>;

export const PostableCroakList: React.FC<{
  thread: number | null;
  getCroaks: GetCroaks;
  croaker: Croaker;
}> = ({ croaker, thread, getCroaks }) => {
  const [inputCroaks, setText, setFile, cancelCroak] = useInputCroaks(thread);

  return (
    <>
      <div className="w-full mt-5 flex flex-nowrap flex-col-reverse justify-start items-center max-w-5xl">
        <Spacing />
        <InputCroaks croaker={croaker} croaks={inputCroaks} cancelCroak={cancelCroak} />
        <LoadingCroaks getCroaks={getCroaks} />
        <Spacing />
      </div>
      <CroakInputFooter postText={setText} postFile={setFile} />
    </>
  );
};

export const FooterLessCroakList: React.FC<{ getCroaks: GetCroaks }> = ({ getCroaks }) => (
  <>
    <div className="w-full mt-5 flex flex-nowrap flex-col-reverse justify-start items-center max-w-5xl">
      <LoadingCroaks getCroaks={getCroaks} />
      <Spacing />
    </div>
  </>
);

export const MessageCroakList: React.FC<{
  getCroaks: GetCroaks;
  linkUrl: string;
  linkName: string;
  description: string;
}> = ({ linkUrl, linkName, description, getCroaks }) => (
  <>
    <div className="w-full mt-5 flex flex-nowrap flex-col-reverse justify-start items-center max-w-5xl">
      <Spacing />
      <LoadingCroaks getCroaks={getCroaks} />
      <Spacing />
    </div>
    <RegisterFooter linkUrl={linkUrl} linkName={linkName} description={description} />
  </>
);

export const CroakList: React.FC<{
  thread: number | null;
  getCroaks: GetCroaks;
  croaker: ClientCroaker;
}> = ({ croaker, thread, getCroaks }) => {
  if (croaker.type === "anonymous") {
    return (
      <MessageCroakList
        linkUrl={"/api/auth/signin"}
        linkName={"Login"}
        description={"You need Login and Register your Information"}
        getCroaks={getCroaks}
      />
    );
  } else if (croaker.type === "logined" || (croaker.type === "registered" && !croaker.value.form_agreement)) {
    return (
      <MessageCroakList
        linkUrl={"/setting/edit"}
        linkName={"Register"}
        description={"You need Register your Information and Agree Form"}
        getCroaks={getCroaks}
      />
    );
  } else {
    return <PostableCroakList croaker={croaker.value} thread={thread} getCroaks={getCroaks} />;
  }
};
