import React from 'react'
import { useState } from "react";
import { isAuthorityFail } from "@/domain/authorization/base";
import { isFetchAccessFail } from "@/lib/io/link";
import { isInvalidArguments } from "@/lib/base/validation";
import { doFetch } from "@/lib/next/utility";
import type { ResponseType as ResponseTypeTopText } from "@/app/api/croak/top/text/route";
import type { ResponseType as ResponseTypeTopFile } from "@/app/api/croak/top/file/route";
import { isFileFail } from "@/lib/io/fileStorage";
import { isImageCommandFail, isImageInformationFail } from "@/lib/io/image";
import { v4 as uuid } from 'uuid'
import { ClientCroaker } from "@/domain/authorization/base";
import { replaceArray, removeArray } from '@/lib/next/utility';
import { GetCroaks, LoadingCroaks } from '@/components/parts/croaks/loadingCroakList'
import { PostingText, PostingFile, InputCroak, InputCroaks } from '@/components/parts/croaks/inputCroakList'
import { CroakInputFooter, RegisterFooter } from '@/components/parts/croaks/footer'
import type { Croaker } from "@/database/query/croaker/croaker";

type EqualInputCroak = (left: InputCroak, right: InputCroak) => boolean;
const equalInputCroak: EqualInputCroak = (left, right) => left.key === right.key;

type PostText = (thread: number | null, setNewInput: (input: InputCroak) => void, newInput: PostingText) => Promise<void>;
const postText: PostText = async (thread, setNewInput, newInput) => {

  const res = await doFetch(`/api/croak/${thread || 'top'}/text`, { method: "POST", body: JSON.stringify({ contents: newInput.contents }) });
  const result = res as ResponseTypeTopText;

  if (isAuthorityFail(result) || isFetchAccessFail(result) || isInvalidArguments(result)) {
    setNewInput({
      ...newInput,
      type: 'text_error',
      errorMessage: result.message,
    });

  } else {
    setNewInput({
      key: newInput.key,
      type: 'posted',
      croak: result,
    });
  }
};

type PostFile = (thread: number | null, setNewInput: (input: InputCroak) => void, newInput: PostingFile) => Promise<void>;
  const postFile: PostFile = async (thread, setNewInput, newInput) => {

  const file = newInput.file;
  const formData = new FormData();
  formData.append("file", file, file.name);

  const res = await doFetch(`/api/croak/${thread || 'top'}/file`, { method: "POST", body: formData });
  const result = res as ResponseTypeTopFile;

  if (
    isAuthorityFail(result) ||
    isFetchAccessFail(result) ||
    isInvalidArguments(result) ||
    isFileFail(result) ||
    isImageCommandFail(result) ||
    isImageInformationFail(result)
  ) {
    setNewInput({
      ...newInput,
      type: 'file_error',
      errorMessage: result.message,
    });

  } else {
    setNewInput({
      key: newInput.key,
      type: 'posted',
      croak: result,
    });
  }
};

export const PostableCroakList: React.FC<{
  thread: number | null;
  getCroaks: GetCroaks;
  croaker: Croaker;
}> = ({ croaker, thread, getCroaks }) => {

  const [inputCroaks, setInputCroaks] = useState<InputCroak[]>([]);

  const setNewInput = (input: InputCroak) => {
    setInputCroaks(replaceArray(equalInputCroak)(input));
  };

  const setText = (text: string) => {
    const newInput = {
      key: uuid(),
      type: 'text',
      contents: text,
    } as const;
    setInputCroaks((oldInputs) => ([...oldInputs, newInput]))
    postText(thread, setNewInput, newInput); // TODO need setTime?
  };

  const setFile = (file: File) => {
    const newInput = {
      key: uuid(),
      type: 'file',
      file: file,
    } as const;
    setInputCroaks((oldInputs) => ([...oldInputs, newInput]))
    postFile(thread, setNewInput, newInput); // TODO need setTime?
  };

  const cancelCroak = (inputCroak: InputCroak) => () => {
    setInputCroaks(removeArray(equalInputCroak)(inputCroak));
  };

  return (
    <>
      <div className="w-full mt-5 flex flex-nowrap flex-col-reverse justify-start items-center">
        <InputCroaks
          croaker={croaker}
          croaks={inputCroaks}
          cancelCroak={cancelCroak}
        />
        <LoadingCroaks getCroaks={getCroaks} />
      </div>
      <CroakInputFooter postText={setText} postFile={setFile}/>
    </>
  );
};

export const FooterLessCroakList: React.FC<{ getCroaks: GetCroaks }> = ({ getCroaks }) => (
  <>
    <div className="w-full mt-5 flex flex-nowrap flex-col-reverse justify-start items-center">
      <LoadingCroaks getCroaks={getCroaks} />
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
    <div className="w-full mt-5 flex flex-nowrap flex-col-reverse justify-start items-center">
      <LoadingCroaks getCroaks={getCroaks} />
    </div>
    <RegisterFooter linkUrl={linkUrl} linkName={linkName} description={description} />
  </>
);

export const CroakList: React.FC<{
  thread: number | null;
  getCroaks: GetCroaks;
  croaker: ClientCroaker;
}> = ({ croaker, thread, getCroaks }) => {
  if (croaker.type === 'anonymous') {
    return (
      <MessageCroakList
        linkUrl={"/auth/signin"}
        linkName={"Login"}
        description={"You need Login and Register your Information"}
        getCroaks={getCroaks}
      />
    );
  } else if (croaker.type === 'logined' || (croaker.type === 'registered' && !croaker.value.form_agreement)) {
    return (
      <MessageCroakList
        linkUrl={"/setting/edit"}
        linkName={"Register"}
        description={"You need Register your Information and Agree Form"}
        getCroaks={getCroaks}
      />
    );
  } else {
    return (
      <PostableCroakList
        croaker={croaker.value}
        thread={thread}
        getCroaks={getCroaks}
      />
    );
  }
};
