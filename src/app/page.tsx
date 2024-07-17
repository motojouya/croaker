'use client'

import React from 'react'
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";
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

type PostText = (text: string) => void;
type PostFile = (file: string) => void; // TODO 引数
const Footer: React.FC<{
  postText: PostText,
  postFile: PostFile,
}> = ({ postText, postFile }) => {
  const { configuration, croaker } = useMaster();

  return (
    <footer className="fixed bottom-0 left-0 w-screen min-h-12 flex flex-nowrap justify-center items-center bg-white border-t">
      {croaker.type === 'anonymous' && (
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
      )}
      {(croaker.type === 'logined' || (croaker.type === 'registered' && !croaker.value.form_agreement)) && (
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
      )}
      {(croaker.type === 'registered' && croaker.value.form_agreement) && (
        <CroakInput postText={postText} postFile={postFile}/>
      )}
    </footer>
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

  return (
    <div className="flex flex-nowrap justify-between items-center w-full max-w-5xl">
      <div className="grow-0 shrink-0 my-1 mr-0 ml-1">
        <Button type="button" variant="link" size="icon" onClick={() => postFile('file!')}>
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
}> = ({ croak, deleteCroak }) => {

  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(`${window.location.protocol}://${window.location.host}/#${croak.croak_id}`);
    setCopied(true);
  };

  return (
    <div>
      <div>
        <div>{`${croak.croaker_name}@${croak.croaker_id}`}</div>
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
};

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

const PostingFile: React.FC<{
  croaker: Croaker;
  file: File;
  thread: number | null;
  deleteThis: () => void;
}> = ({ croaker, file, thread, deleteThis }) => {

  const [croak, setCroak] = useState<CroakType | null>(null);
  const [fileSrc, setFileSrc] = useState<string | null>(null);

  useEffect(() => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => setFileSrc(reader.result as string);
  });

  useEffect(() => {
    (async () => {
      // @ts-ignore
      if (croak.croak_id) {
        return;
      }

      const formData = new FormData();
      formData.append("file", file, file.name);

      const res = await doFetch(`/api/croak/${thread || 'top'}/file`, { method: "POST", body: formData });
      const result = res as ResponseTypeThreadFile;
      if (
        isAuthorityFail(result) ||
        isFetchAccessFail(result) ||
        isInvalidArguments(result) ||
        isFileFail(result) ||
        isImageCommandFail(result) ||
        isImageInformationFail(result)
      ) {
        alert(result.message);
        setCroak(null);
      } else {
        setCroak(result);
      }
    })();
  });

  return (
    <>
      {!croak && (
        <div>
          <div>
            <div>{`${croaker.croaker_name}@${croaker.croaker_id}`}</div>
            <div>posting...</div>
          </div>
          <div>
            {fileSrc && (
              <Image src={fileSrc} alt={file.name} />
            )}
          </div>
        </div>
      )}
      {croak && (
        <Croak croak={croak} deleteCroak={deleteThis}/>
      )}
    </>
  );
};

const PostingText: React.FC<{
  croaker: Croaker;
  contents: string;
  thread: number | null;
  deleteThis: () => void;
}> = ({ croaker, contents, thread, deleteThis }) => {

  const [croak, setCroak] = useState<CroakType | null>(null);

  // TODO ここ1度だけ実行されることが保証されてる？
  useEffect(() => {
    (async () => {
      // @ts-ignore
      if (croak.croak_id) {
        return;
      }

      const res = await doFetch(`/api/croak/${thread || 'top'}/text`, { method: "POST", body: JSON.stringify({ contents }) });
      const result = res as ResponseTypeTopText;
      if (isAuthorityFail(result) || isFetchAccessFail(result) || isInvalidArguments(result)) {
        alert(result.message);
        setCroak(null);
      } else {
        setCroak(result);
      }
    })();
  });

  return (
    <>
      {!croak && (
        <div>
          <div>
            <div>{`${croaker.croaker_name}@${croaker.croaker_id}`}</div>
            <div>posting...</div>
          </div>
          <div><MultiLineText text={contents} /></div>
        </div>
      )}
      {croak && (
        <Croak croak={croak} deleteCroak={deleteThis}/>
      )}
    </>
  );
};

const InstantCroaks: React.FC<{ croaker: Croaker }> = ({ croaker }) => {
  const [instantCroaks, setInstantCroaks] = useState<InstantCroak[]>([]);
  return (
    <>
      {instantCroaks.map((instantCroak, index) => {
        if (instantCroak.type === 'text') {
          return (
            <PostingText
              key={`instant-${index}`}
              croaker={croaker}
              contents={instantCroak.contents}
              thread={instantCroak.thread}
              deleteThis={() => setInstantCroaks(instantCroaks.toSpliced(index, 1))}
            />
          );
        } else {
          return (
            <PostingFile
              key={`instant-${index}`}
              croaker={croaker}
              file={instantCroak.file}
              thread={instantCroak.thread}
              deleteThis={() => setInstantCroaks(instantCroaks.toSpliced(index, 1))}
            />
          );
        }
      })}
    </>
  );
};

const CroakGroup: React.FC<{ croaker: Croaker, thread: number | null }> = ({ croaker, thread }) => {
  const { data, error, isLoading } = useSWR(`/api/croak/${thread || 'top'}`, loadFetch); // TODO query parameters
  const result = data as ResponseTypeTop;

  return (
    <>
      {isLoading && ('loading...')}
      {error && ('error!')}
      {isFileFail(result) && (result.message)}
      {!isFileFail(result) && <Croaks croakList={result.croaks} />}
    </>
  );
};

type GetSplicedCroak = (croaks: CroakType[], croak_id: number) => CroakType[];
const getSplicedCroak: GetSplicedCroak = (croaks, croak_id) => {
  const index = croaks.findIndex((croak) => croak.croak_id === croak_id);
  return croaks.toSpliced(index, 1);
};

const Croaks: React.FC<{ croakList: CroakType[] }> = ({ croakList }) => {
  const [croaks, setCroaks] = useState<CroakType[]>(croakList);
  // TODO ここでIntersectionObserverで監視する
  return (
    <>
      {croaks.map((croak) => (
        <Croak
          key={`croak-${croak.croak_id}`}
          croak={croak}
          deleteCroak={(croak_id: number) => setCroaks(getSplicedCroak(croaks, croak_id))}
        />
      ))}
    </>
  );
};

export default function Page() {
  const mock = (text: string) => console.log(text);
  return (
    <>
      <div className="w-full mt-5 flex flex-nowrap flex-col-reverse justify-start items-center">
        {posts.map(post => (
          <Croak
            key={`croak-${post.croak_id}`}
            croak={post}
            deleteCroak={(croak_id: number) => console.log('delete', croak_id)}
          />
        ))}
      </div>
      <Footer
        postText={mock}
        postFile={mock}
      />
    </>
  );
}
