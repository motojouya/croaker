import React from 'react'
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PaperPlaneIcon, ImageIcon } from "@radix-ui/react-icons";
import { Croak as CroakType } from "@/domain/croak/croak";
import { format } from "date-fns";
import { MultiLineText } from '@/components/parts/MultiLineText'
import { ResponseType as ResponseTypeDelete } from '@/app/api/croak/[croak_id]/delete/route';
import { isRecordNotFound } from "@/database/fail";
import { isAuthorityFail } from "@/domain/authorization/base";
import { isFetchAccessFail } from "@/lib/io/link";
import { isInvalidArguments } from "@/lib/base/validation";
import { doFetch } from "@/lib/next/utility";
import useSWR from "swr";
import type { Croaker } from "@/database/query/croaker/croaker";
import type { ResponseType as ResponseTypeThreadText } from "@/app/api/croak/[croak_id]/text/route";
import type { ResponseType as ResponseTypeThreadFile } from "@/app/api/croak/[croak_id]/file/route";
import type { ResponseType as ResponseTypeTopText } from "@/app/api/croak/top/text/route";
import type { ResponseType as ResponseTypeTopFile } from "@/app/api/croak/top/file/route";
import type { ResponseType as ResponseTypeThread } from "@/app/api/croak/[croak_id]/route";
import type { ResponseType as ResponseTypeTop } from "@/app/api/croak/top/route";
import { loadFetch } from "@/lib/next/utility";
import { isFileFail } from "@/lib/io/fileStorage";
import { isImageCommandFail, isImageInformationFail } from "@/lib/io/image";
import { v4 as uuid } from 'uuid'
import { ClientCroaker } from "@/domain/authorization/base";
import { replaceArray, removeArray } from '@/lib/next/utility';
import { Croak } from '@/components/parts/croaks/croak'
import { GetCroaks, CroakList } from '@/components/parts/croaks/croakList'

type PostingText = {
  key: string;
  type: 'text';
  contents: string;
};
type PostingFile =  {
  key: string;
  type: 'file';
  file: File;
};
type ErrorText = {
  key: string;
  type: 'text_error';
  contents: string;
  errorMessage: string;
};
type ErrorFile = {
  key: string;
  type: 'file_error';
  file: File;
  errorMessage: string;
};
type PostedCroak = {
  key: string;
  type: 'posted';
  croak: CroakType;
};

type PostedInput = ErrorText | ErrorFile | PostedCroak;
type InputCroak = PostingText | PostingFile | PostedInput;

type PostText = (text: string) => void;
type PostFile = (file: File) => void;

type EqualInputCroak = (left: InputCroak, right: InputCroak) => boolean;
const equalInputCroak: EqualInputCroak = (left, right) => left.key === right.key;

type SetNewInput = (input: InputCroak) => void;
const postText = async (thread: number | null, setNewInput: SetNewInput, newInput: PostingText) => {

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

const postFile = async (thread: number | null, setNewInput: SetNewInput, newInput: PostingFile) => {

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

const InputableList: React.FC<{
  croaker: Croaker;
  thread: number | null;
}> = ({ croaker, thread }) => {

  const [inputCloaks, setInputCloaks] = useState<InputCroak[]>([]);

  const setNewInput = (input: InputCroak) => {
    setInputCloaks(replaceArray(equalInputCroak)(input));
  };

  const setText = (text: string) => {
    const newInput = {
      key: uuid(),
      type: 'text',
      contents: text,
    } as const;
    setInputCloaks((oldInputs) => ([...oldInputs, newInput]))
    postText(thread, setNewInput, newInput); // TODO need setTime?
  };

  const setFile = (file: File) => {
    const newInput = {
      key: uuid(),
      type: 'file',
      file: file,
    } as const;
    setInputCloaks((oldInputs) => ([...oldInputs, newInput]))
    postFile(thread, setNewInput, newInput); // TODO need setTime?
  };

  const cancelCroak = (inputCroak: InputCroak) => () => {
    setInputCloaks(removeArray(equalInputCroak)(inputCroak));
  };

  return (
    <>
      {inputCloaks.map((inputCloak) => {
        if (inputCloak.type === 'text') {
          return (
            <InputTextCroak
              key={inputCloak.key}
              croaker={croaker}
              contents={inputCloak.contents}
              message={'loading...'}
              deleteCroak={cancelCroak(inputCloak)}
            />
          );
        } else if (inputCloak.type === 'file') {
          return (
            <InputFileCroak
              key={inputCloak.key}
              croaker={croaker}
              file={inputCloak.file}
              message={'loading...'}
              deleteCroak={cancelCroak(inputCloak)}
            />
          );
        } else if (inputCloak.type === 'text_error') {
          return (
            <InputTextCroak
              key={inputCloak.key}
              croaker={croaker}
              contents={inputCloak.contents}
              message={`Error! ${inputCloak.errorMessage}`}
              deleteCroak={cancelCroak(inputCloak)}
            />
          );
        } else if (inputCloak.type === 'file_error') {
          return (
            <InputFileCroak
              key={inputCloak.key}
              croaker={croaker}
              file={inputCloak.file}
              message={`Error! ${inputCloak.errorMessage}`}
              deleteCroak={cancelCroak(inputCloak)}
            />
          );
        } else {
          return (
            <Croak
              key={inputCloak.key}
              croak={inputCloak.croak}
              deleteCroak={cancelCroak(inputCloak)}
              loadSurround={null}
            />
          );
        }
      })}
      <footer className="fixed bottom-0 left-0 w-screen min-h-12 flex flex-nowrap justify-center items-center bg-white border-t">
        <CroakInput postText={setText} postFile={setFile}/>
      </footer>
    </>
  );
};


const CroakInput: React.FC<{
  postText: PostText,
  postFile: PostFile,
}> = ({ postText, postFile }) => {

  const [croakText, setCroakText] = useState('');
  const [rows, setRows] = useState(1);

  const handleOnChange = (text: string) => {
    setRows(text.split('\n').length);
    setCroakText(text);
  }

  const submit = () => {
    postText(croakText);
    setRows(1);
    setCroakText('');
  };

  const onChangeFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      if (confirm(`${files[0]}をUploadしますか？`)) {
        postFile(files[0]);
      }
    }
  }

  // TODO input file装飾
  // https://qiita.com/shuheix/items/f618e9d6cdd063e10b72
  return (
    <div className="flex flex-nowrap justify-between items-center w-full max-w-5xl">
      <div className="grow-0 shrink-0 my-1 mr-0 ml-1">
        <input
          name="file"
          type="file"
          accept="image/*"
          onChange={onChangeFile}
        />
        <Button type="button" variant="link" size="icon" onClick={() => console.log('TODO file!')}>
          <ImageIcon />
        </Button>
      </div>
      <div className="grow shrink my-1">
        <Textarea
          rows={rows}
          placeholder="Post Croak..."
          value={croakText}
          onChange={(e) => handleOnChange(e.target.value)}
          className="p-1 min-h-fit border-t-0 border-x-0 rounded-none focus-visible:ring-0 bg-transparent"
        />
      </div>
      <div className="grow-0 shrink-0 my-1 mr-1 ml-0">
        <Button type="button" variant="link" size="icon" onClick={submit}>
          <PaperPlaneIcon />
        </Button>
      </div>
    </div>
  );
};

const posts = Array(20).fill(0).map((v, index) => ({
  croak_id: index,
  croaker_id: 'own6r',
  contents: 'test' + index,
  thread: null,
  posted_date: new Date(),
  deleted_date: null,
  has_thread: false,
  croaker_name: 'name',
  links: [],
  files: [],
}));

type InstantCroak =
  | {
    type: 'text';
    contents: string;
    thread: number | null;
  }
  | {
    type: 'file';
    file: File;
    thread: number | null;
  };

// {`Error! ${errorMessage}`}
const InputFileCroak: React.FC<{
  croaker: Croaker;
  file: File;
  message: string;
  deleteCroak: () => void,
}> = ({ croaker, file, message, deleteCroak }) => {

  const [fileSrc, setFileSrc] = useState<string | null>(null);

  useEffect(() => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => setFileSrc(reader.result as string);
  });

  return (
    <div>
      <div>
        <div>{`${croaker.croaker_name}@${croaker.croaker_id}`}</div>
        <div>{message}</div>
        <div>
          <Button type="button" variant="link" size="icon" onClick={deleteCroak}>
            <p>Delete</p>
          </Button>
        </div>
      </div>
      <div>
        {fileSrc && (
          <Image src={fileSrc} alt={file.name} />
        )}
      </div>
    </div>
  );
};

const InputTextCroak: React.FC<{
  croaker: Croaker;
  contents: string;
  message: string;
  deleteCroak: () => void,
}> = ({ croaker, contents, message, deleteCroak }) => {

  return (
    <div>
      <div>
        <div>{`${croaker.croaker_name}@${croaker.croaker_id}`}</div>
        <div>{message}</div>
        <div>
          <Button type="button" variant="link" size="icon" onClick={deleteCroak}>
            <p>Delete</p>
          </Button>
        </div>
      </div>
      <div><MultiLineText text={contents} /></div>
    </div>
  );
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

// TODO 下から並べるので、並びがおかしい
// InputableListが入力croakを持っているが最新だが、これだとCroakListのほうが表示されてしまう
export const PostableCroakList: React.FC<{
  thread: number | null;
  getCroaks: GetCroaks;
  croaker: ClientCroaker;
}> = ({ croaker, thread, getCroaks }) => {
  return (
    <>
      <div className="w-full mt-5 flex flex-nowrap flex-col-reverse justify-start items-center">
        <CroakList getCroaks={getCroaks} />
        {croaker.type === 'anonymous' && (
          <footer className="fixed bottom-0 left-0 w-screen min-h-12 flex flex-nowrap justify-center items-center bg-white border-t">
            <div className="flex flex-nowrap justify-between items-center w-full max-w-5xl h-12">
              <div className="grow shrink m-2">
                <p>You need Login and Register your Information</p>
              </div>
              <div className="grow-0 shrink-0 m-2">
                <Link href={"/auth/signin"} className={buttonVariants({ variant: "procedure" })}>
                  <p>Login</p>
                </Link>
              </div>
            </div>
          </footer>
        )}
        {(croaker.type === 'logined' || (croaker.type === 'registered' && !croaker.value.form_agreement)) && (
          <footer className="fixed bottom-0 left-0 w-screen min-h-12 flex flex-nowrap justify-center items-center bg-white border-t">
            <div className="flex flex-nowrap justify-between items-center w-full max-w-5xl h-12">
              <div className="grow shrink m-2">
                <p>You need Register your Information and Agree Form</p>
              </div>
              <div className="grow-0 shrink-0 m-2">
                <Link href={"/setting/edit"} className={buttonVariants({ variant: "procedure" })}>
                  <p>Register</p>
                </Link>
              </div>
            </div>
          </footer>
        )}
        {(croaker.type === 'registered' && croaker.value.form_agreement) && (
          <InputableList croaker={croaker.value} thread={thread} />
        )}
      </div>
    </>
  );
};
