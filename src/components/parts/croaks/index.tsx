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
import { PostingText, PostingFile, InputCroak, GetCroaks, CroakList, InputCroaks } from '@/components/parts/croaks/croakList'
import { CroakInputFooter, RegisterFooter } from '@/components/parts/croaks/footer'

type EqualInputCroak = (left: InputCroak, right: InputCroak) => boolean;
const equalInputCroak: EqualInputCroak = (left, right) => left.key === right.key;

const postText = async (thread: number | null, setNewInput: (input: InputCroak) => void, newInput: PostingText) => {

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

const postFile = async (thread: number | null, setNewInput: (input: InputCroak) => void, newInput: PostingFile) => {

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

export const UnPostableCroakList: React.FC<{
  getCroaks: GetCroaks;
  croaker: ClientCroaker;
}> = ({ croaker, getCroaks }) => {
  return (
    <>
      <div className="w-full mt-5 flex flex-nowrap flex-col-reverse justify-start items-center">
        <CroakList getCroaks={getCroaks} />
      </div>
    </>
  );
};

const loginDescription = "You need Login and Register your Information";
const registerDescription = "You need Register your Information and Agree Form";

export const PostableCroakList: React.FC<{
  thread: number | null;
  getCroaks: GetCroaks;
  croaker: ClientCroaker;
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
        {(croaker.type === 'registered' && croaker.value.form_agreement) && (
          <InputCroaks
            croaker={croaker.value}
            croaks={inputCroaks}
            cancelCroak={cancelCroak}
          />
        )}
        <CroakList getCroaks={getCroaks} />
      </div>
      {croaker.type === 'anonymous' && (
        <RegisterFooter linkUrl={"/auth/signin"} linkName={"Login"} description={loginDescription} />
      )}
      {(croaker.type === 'logined' || (croaker.type === 'registered' && !croaker.value.form_agreement)) && (
        <RegisterFooter linkUrl={"/setting/edit"} linkName={"Register"} description={registerDescription} />
      )}
      {(croaker.type === 'registered' && croaker.value.form_agreement) && (
        <CroakInputFooter postText={setText} postFile={setFile}/>
      )}
    </>
  );
};
