'use client'

import React from 'react'
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Ref, RefObject, forwardRef, useCallback, useState, useRef, useEffect } from "react";
import { useMaster } from "@/app/SessionProvider";
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

const setPostedInput = (newInput: PostedInput) => (oldInputs: InputCroak[]) => {
  const inputIndex = oldInputs.findIndex((oldInput) => oldInput.key === newInput.key);
  if (inputIndex === -1) {
    return oldInputs;
  } else {
    return oldInputs.toSpliced(inputIndex, 1, newInput);
  }
};

const InputableList: React.FC<{
  croaker: Croaker;
  thread: number | null;
}> = ({ croaker, thread }) => {

  const [inputCloaks, setInputCloaks] = useState<InputCroak[]>([]);

  const postText = async (newInput: PostingText) => {

    const res = await doFetch(`/api/croak/${thread || 'top'}/text`, { method: "POST", body: JSON.stringify({ contents: newInput.contents }) });
    const result = res as ResponseTypeTopText;

    if (isAuthorityFail(result) || isFetchAccessFail(result) || isInvalidArguments(result)) {
      setInputCloaks(setPostedInput({
        ...newInput,
        type: 'text_error',
        errorMessage: result.message,
      }));

    } else {
      setInputCloaks(setPostedInput({
        key: newInput.key,
        type: 'posted',
        croak: result,
      }));
    }
  };

  const setText = (text: string) => {

    const newInput = {
      key: uuid(),
      type: 'text',
      contents: text,
    } as const;

    setInputCloaks((oldInputs) => ([...oldInputs, newInput]))

    setTimeout(() => {
      postText(newInput);
    });
  };

  const postFile = async (newInput: PostingFile) => {

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
      setInputCloaks(setPostedInput({
        ...newInput,
        type: 'file_error',
        errorMessage: result.message,
      }));

    } else {
      setInputCloaks(setPostedInput({
        key: newInput.key,
        type: 'posted',
        croak: result,
      }));
    }
  };

  const setFile = (file: File) => {

    const newInput = {
      key: uuid(),
      type: 'file',
      file: file,
    } as const;

    setInputCloaks((oldInputs) => ([...oldInputs, newInput]))

    setTimeout(() => {
      postFile(newInput);
    });
  };

  const cancelCroak = (key: string) => () => {
    setInputCloaks((oldInputs) => {
      const inputIndex = oldInputs.findIndex((oldInput) => oldInput.key === key);
      if (inputIndex === -1) {
        return oldInputs;
      } else {
        return oldInputs.toSpliced(inputIndex, 1);
      }
    })
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
              deleteCroak={cancelCroak(inputCloak.key)}
            />
          );
        } else if (inputCloak.type === 'file') {
          return (
            <InputFileCroak
              key={inputCloak.key}
              croaker={croaker}
              file={inputCloak.file}
              message={'loading...'}
              deleteCroak={cancelCroak(inputCloak.key)}
            />
          );
        } else if (inputCloak.type === 'text_error') {
          return (
            <InputTextCroak
              key={inputCloak.key}
              croaker={croaker}
              contents={inputCloak.contents}
              message={`Error! ${inputCloak.errorMessage}`}
              deleteCroak={cancelCroak(inputCloak.key)}
            />
          );
        } else if (inputCloak.type === 'file_error') {
          return (
            <InputFileCroak
              key={inputCloak.key}
              croaker={croaker}
              file={inputCloak.file}
              message={`Error! ${inputCloak.errorMessage}`}
              deleteCroak={cancelCroak(inputCloak.key)}
            />
          );
        } else {
          return (
            <Croak
              key={inputCloak.key}
              croak={inputCloak.croak}
              deleteCroak={cancelCroak(inputCloak.key)}
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

const deleteCroakFetch = async (croak_id: number, callback: (croak_id: number) => void) => {
  if (!confirm("本当に削除して大丈夫ですか？")) {
    return;
  }

  const res = await doFetch(`/api/croak/${croak_id}/delete`, { method: "POST" });
  const result = res as ResponseTypeDelete;

  if (isAuthorityFail(result) || isRecordNotFound(result)) {
    alert(result.message);
    return;
  }

  callback(croak_id);
};

const Croak: React.FC<{
  croak: CroakType;
  deleteCroak: (croak_id: number) => void,
  loadSurround: (() => void) | null,
}> = (({ croak, deleteCroak, loadSurround }) => {

  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(`${window.location.protocol}://${window.location.host}/#${croak.croak_id}`);
    setCopied(true);
  };

  const ref = useInfinityScroll(loadSurround || (() => { throw new Error('') }));

  return (
    <div>
      <div>
        {loadSurround && (
          <div ref={ref}>{`${croak.croaker_name}@${croak.croaker_id}`}</div>
        )}
        {!loadSurround && (
          <div>{`${croak.croaker_name}@${croak.croaker_id}`}</div>
        )}
        <div>{format(croak.posted_date, "yyyy/MM/dd HH:mm")}</div>
        <div>
          <Link href={`/thread/${croak.croak_id}`}>
            <p>Thread</p>
          </Link>
        </div>
        <div>
          <Button type="button" variant="link" size="icon" onClick={copy}>
            {copied && (
              <p>Copied!</p>
            )}
            {!copied && (
              <p>Copy URL</p>
            )}
          </Button>
        </div>
        <div>
          <Button type="button" variant="link" size="icon" onClick={() => deleteCroakFetch(croak.croak_id, deleteCroak)}>
            <p>Delete</p>
          </Button>
        </div>
      </div>
      <div><MultiLineText text={croak.contents || ''} /></div>
      <div>
        {croak.files.map((file, index) => {
          if (file.content_type.startsWith('image')) {
            return <Image key={`croak-${croak.croak_id}-file-${index}`} src={file.url} alt={file.name} />;
          } else {
            return file.name;
          }
        })}
      </div>
      <div>
        {croak.links.map((link, index) => (
          <React.Fragment key={`croak-${croak.croak_id}-link-${index}`}>
            <Link href={link.url || ''}>
              <p>{link.title || ''}</p>
              {link.image && (
                <Image src={link.image} alt={link.title || ''} />
              )}
              <MultiLineText text={link.description || ''} />
            </Link>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
});

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

type GetSplicedCroak = (croaks: CroakType[], croak_id: number) => CroakType[];
const getSplicedCroak: GetSplicedCroak = (croaks, croak_id) => {
  const index = croaks.findIndex((croak) => croak.croak_id === croak_id);
  return croaks.toSpliced(index, 1);
};

const intersectionObserverOptions ={
  root: null, // ルート要素 (viewport) を使用
  rootMargin: '0px',
  threshold: 0, // 要素が少しでもビューポートに表示された瞬間からコールバックが呼び出される
}

type LoadSurround = () => void;
type UseInfinityScroll = (loadSurround: () => void) => RefObject<HTMLDivElement>;
const useInfinityScroll: UseInfinityScroll = (loadSurround) => {

  const ref = useRef<HTMLDivElement>(null);

  const scrollObserver = useCallback(() => {
    return new IntersectionObserver((entries) => {
      entries
        .filter((entry) => entry.isIntersecting)
        .forEach((entry) => loadSurround());
    }, intersectionObserverOptions);
  }, [loadSurround]);

  useEffect(() => {
    const target = ref.current;
    if (target) {
      const observer = scrollObserver();
      observer.observe(target);
      return () => {
        observer.unobserve(target);
      };
    }
  }, [scrollObserver, ref]);

  return ref;
};

// TODO startingPointを使って最初のものはカーソル移動する
const Croaks: React.FC<{
  croakList: CroakType[],
  loadSurround: LoadSurround,
  startingPoint: boolean;
}> = ({ croakList, loadSurround, startingPoint }) => {

  const [croaks, setCroaks] = useState<CroakType[]>(croakList);

  return (
    <>
      {croaks.map((croak, index) => {
        return (
          <Croak
            loadSurround={index === 0 ? loadSurround : null}
            key={`croak-${croak.croak_id}`}
            croak={croak}
            deleteCroak={(croak_id: number) => setCroaks(getSplicedCroak(croaks, croak_id))}
          />
        );
      })}
    </>
  );
};

type CroakGroupInformation = {
  offsetCursor: number | null;
  reverse: boolean;
  startingPoint: boolean;
};
type CroakGroupType =
  | CroakGroupInformation & { type: 'loading'; }
  | CroakGroupInformation & { type: 'loaded'; croaks: CroakType[]; }
  | CroakGroupInformation & { type: 'error'; errorMessage: string; };

type GetCroaks = (offsetCursor: number | null, reverse: boolean) => Promise<ResponseTypeTop>; 

type GetTopCroaks = () => GetCroaks;
const getTopCroaks: GetTopCroaks = () => async (offsetCursor, reverse) => {
  const res = await doFetch(`/api/croak/top?reverse=${reverse}&offset_cursor=${offsetCursor || ''}`, { method: "GET" });
  return res as ResponseTypeTop;
};

type GetThreadCroaks = (thread: number) => GetCroaks;
const getThreadCroaks: GetThreadCroaks = (thread) => async (offsetCursor, reverse) => {
  const res = await doFetch(`/api/croak/${thread}?reverse=${reverse}&offset_cursor=${offsetCursor || ''}`, { method: "GET" });
  return res as ResponseTypeTop;
};

type SearchCroaks = (text: string) => GetCroaks;
const searchCroaks: SearchCroaks = (text) => async (offsetCursor, reverse) => {
  const res = await doFetch(`/api/croak/search?text=${text}&reverse=${reverse}&offset_cursor=${offsetCursor || ''}`, { method: "GET" });
  return res as ResponseTypeTop;
};

/*
 * 順番が重要
 * 先に先頭をいじってしまうと、indexが変わるのでロジックがおかしくなる
 * 先に末尾にpush or 末尾削除して、その後、先頭にunshift or 先頭削除する
 *
 * ここではロード対象のcroakGroupの登録のみ。
 * 実際にロードするのは非同期で次のprocessで行う
 */
type LoadCroaks = (newGroup: CroakGroupType) => Promise<void>
type GetNewCroakGroup = (loadCroaks: LoadCroaks, croakGroupIndex: number, croakGroups: CroakGroupType[], firstCursor: number, lastCursor: number) => CroakGroupType[];
const getNewCroakGroup: GetNewCroakGroup = (loadCroaks, croakGroupIndex, croakGroups, firstCursor, lastCursor) => {

  let newCroakGroups = [...croakGroups];

  if (croakGroupIndex === (croakGroups.length - 1)) {
    const newGroup = {
      offsetCursor: lastCursor,
      reverse: false,
      startingPoint: false,
      type: 'loading',
    } as const;
    newCroakGroups.push(newGroup);
    setTimeout(async () => loadCroaks(newGroup));

  } else if (croakGroupIndex < (croakGroups.length - 3)) {
    const spliceStart = croakGroupIndex + 2;
    const spliceQuantity = (croakGroups.length - (1 + spliceStart));
    newCroakGroups.splice(spliceStart, spliceQuantity);
  }

  if (croakGroupIndex === 0) {
    const newGroup = {
      offsetCursor: firstCursor,
      reverse: true,
      startingPoint: false,
      type: 'loading',
    } as const;
    newCroakGroups.unshift(newGroup);
    setTimeout(async () => loadCroaks(newGroup));

  } else if (croakGroupIndex > 2) {
    newCroakGroups.splice(0, croakGroupIndex - 2);
  }

  return newCroakGroups;
};

type EqualGroup = (left: CroakGroupType, right: CroakGroupType) => boolean;
const equalGroup: EqualGroup = (left, right) => {
  return left.offsetCursor === right.offsetCursor
    && left.reverse === right.reverse
    && left.startingPoint === right.startingPoint;
};

type SetLoadedCroakGroup = (newGroup: CroakGroupType) => (oldGroups: CroakGroupType[]) => CroakGroupType[];
const setLoadedCroakGroup: SetLoadedCroakGroup = (newGroup) => (oldGroups) => {

  const croakGroupIndex = oldGroups.findIndex((croakGroup) => equalGroup(croakGroup, newGroup));
  if (croakGroupIndex === -1) {
    return oldGroups;
  }

  const croakGroup = oldGroups.at(croakGroupIndex) as CroakGroupType;
  if (croakGroup.type !== 'loading') {
    return oldGroups;
  }

  return oldGroups.toSpliced(croakGroupIndex, 1, newGroup);
}

type SetSurroundCroakGroup = (loadCroaks: LoadCroaks, newGroup: CroakGroupType) => (oldGroups: CroakGroupType[]) => CroakGroupType[];
const setSurroundCroakGroup: SetSurroundCroakGroup = (loadCroaks, baseGroup) => (oldGroups) => {

  const croakGroupIndex = oldGroups.findIndex((croakGroup) => equalGroup(croakGroup, baseGroup));
  if (croakGroupIndex === -1) {
    return oldGroups;
  }

  const croakGroup = oldGroups.at(croakGroupIndex) as CroakGroupType;
  if (croakGroup.type !== 'loaded' || croakGroup.croaks.length === 0) {
    return oldGroups;
  }

  // croakGroup.croaks.length === 0で既に弾いているので必ずある
  const firstCroak = croakGroup.croaks.at(0) as CroakType;
  const firstCursor = firstCroak.croak_id;
  const lastCroak = croakGroup.croaks.at(croakGroup.croaks.length - 1) as CroakType;
  const lastCursor = lastCroak.croak_id;

  return getNewCroakGroup(loadCroaks, croakGroupIndex, oldGroups, firstCursor, lastCursor);
};

const CroakList: React.FC<{
  getCroaks: GetCroaks,
}> = ({ getCroaks }) => {

  const [croakGroups, setCroakGroups] = useState<CroakGroupType[]>([]);

  const loadCroaks = useCallback(async (loadingGroup: CroakGroupType) => {

    const result = await getCroaks(loadingGroup.offsetCursor, loadingGroup.reverse);

    if (isFileFail(result)) {
      setCroakGroups(setLoadedCroakGroup({
        ...loadingGroup,
        type: 'error',
        errorMessage: result.message,
      }));

    } else {
      setCroakGroups(setLoadedCroakGroup({
        ...loadingGroup,
        type: 'loaded',
        croaks: result.croaks, // TODO 直接resultがcroaksであるように修正する
      }));
    }
  }, [getCroaks, setCroakGroups]);

  const loadSurround = (baseGroup: CroakGroupType) => () => {
    setCroakGroups(setSurroundCroakGroup(loadCroaks, baseGroup));
  }

  useEffect(() => {
    if (croakGroups.length === 0) {
      const startingGroup = {
        offsetCursor: null,
        reverse: false,
        startingPoint: true,
        type: 'loading',
      } as const;
      setCroakGroups([startingGroup]);

      setTimeout(() => loadCroaks(startingGroup));
    }
  }, [croakGroups, setCroakGroups, loadCroaks]);

  return (
    <>
      {croakGroups.map((croakGroup) => {
        const key = `croak-group-${croakGroup.offsetCursor || 'none'}-${croakGroup.reverse}`;
        if (croakGroup.type == 'loading') {
          return (<p key={key} >loading</p>);

        } else if (croakGroup.type == 'loaded') {
          return (
            <React.Fragment key={key}>
              {croakGroup.croaks.length > 0 && (
                <Croaks
                  croakList={croakGroup.croaks}
                  loadSurround={loadSurround(croakGroup)}
                  startingPoint={croakGroup.startingPoint}
                />
              )}
            </React.Fragment>
          );
        } else {
          return (
            <p key={key}>{`Error! ${croakGroup.errorMessage}`}</p>
          );
        }
      })}
    </>
  );
};

const UnPostableCroakList: React.FC<{
  getCroaks: GetCroaks;
}> = ({ getCroaks }) => {
  const { configuration, croaker } = useMaster();
  return (
    <>
      <div className="w-full mt-5 flex flex-nowrap flex-col-reverse justify-start items-center">
        <CroakList getCroaks={getCroaks} />
      </div>
    </>
  );
};

const PostableCroakList: React.FC<{
  thread: number | null;
  getCroaks: GetCroaks;
}> = ({ thread, getCroaks }) => {
  const { configuration, croaker } = useMaster();
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

export default function Page() {
  return <PostableCroakList thread={null} getCroaks={getTopCroaks()} />;
}
